import { Response } from "express";
import mongoose from "mongoose";
import Book from "../models/book.model";
import BookIssue from "../models/book-issue.model";
import { User } from "../models/user.model";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";

// Cast models to any to bypass Mongoose TS typings conflict
const BookModel = Book as any;
const BookIssueModel = BookIssue as any;
const UserModel = User as any;

// Helper to synthesize firstName/lastName from name
const formatUser = (user: any) => {
  if (!user) return user;
  const rawUser = user.toObject ? user.toObject() : user;
  const nameParts = (rawUser.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  return {
    ...rawUser,
    firstName,
    lastName,
  };
};

const formatIssue = (issue: any) => {
  if (!issue) return issue;
  const rawIssue = issue.toObject ? issue.toObject() : issue;
  if (rawIssue.borrowerId && typeof rawIssue.borrowerId === "object") {
    rawIssue.borrowerId = formatUser(rawIssue.borrowerId);
  }
  if (rawIssue.issuedBy && typeof rawIssue.issuedBy === "object") {
    rawIssue.issuedBy = formatUser(rawIssue.issuedBy);
  }
  if (rawIssue.returnedBy && typeof rawIssue.returnedBy === "object") {
    rawIssue.returnedBy = formatUser(rawIssue.returnedBy);
  }
  return rawIssue;
};

// ─── Borrowers ────────────────────────────────────────────────────────────────
export const getBorrowers = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    const { search } = req.query as any;
    const query: any = {
      role: { $nin: ["parent", "PARENT"] },
    };

    if (search) {
      const searchStr = search.trim();
      const searchRegex = new RegExp(searchStr, "i");
      query.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ];
    }

    const borrowers = await UserModel.find(query)
      .select("name email role phone profileImage")
      .limit(50)
      .lean();

    const borrowerIds = borrowers.map((b: any) => b._id);
    const activeCounts = await BookIssueModel.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId.toString()),
          borrowerId: { $in: borrowerIds },
          status: { $in: ["Issued", "Overdue"] },
        },
      },
      {
        $group: {
          _id: "$borrowerId",
          count: { $sum: 1 },
        },
      },
    ]);

    const activeCountsMap = activeCounts.reduce((acc: any, curr: any) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const borrowersWithActiveCounts = borrowers.map((b: any) => {
      const formatted = formatUser(b);
      return {
        ...formatted,
        photo: b.profileImage || null,
        activeBorrowCount: activeCountsMap[b._id.toString()] || 0,
      };
    });

    return res.status(200).json({ success: true, data: { borrowers: borrowersWithActiveCounts } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Library Stats ────────────────────────────────────────────────────────────
export const getLibraryStats = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    // Sync overdue statuses first
    await BookIssueModel.updateMany(
      {
        schoolId,
        status: "Issued",
        dueDate: { $lt: new Date() },
      },
      {
        $set: { status: "Overdue" },
      }
    );

    // 1. Total Titles (count unique books)
    const totalTitles = await BookModel.countDocuments({ schoolId });

    // 2. Sum available copies
    const copiesStats = await BookModel.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId.toString()) } },
      {
        $group: {
          _id: null,
          totalCopies: { $sum: "$numberOfCopies" },
          availableCopies: { $sum: "$availableCopies" },
        },
      },
    ]);

    const totalCopies = copiesStats[0]?.totalCopies || 0;
    const availableCopies = copiesStats[0]?.availableCopies || 0;

    // Sum total fines collected
    const fineStats = await BookIssueModel.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId.toString()), fineAmount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalFines: { $sum: "$fineAmount" },
        },
      },
    ]);
    const totalFines = fineStats[0]?.totalFines || 0;

    // 3. Active Borrowings (Issued + Overdue)
    const activeBorrowings = await BookIssueModel.countDocuments({
      schoolId,
      status: { $in: ["Issued", "Overdue"] },
    });

    // 4. Overdue Books
    const overdueBooksCount = await BookIssueModel.countDocuments({
      schoolId,
      status: "Overdue",
    });

    // 5. Overdue Tracker List (top 10 overdue)
    const overdueBooksListRaw = await BookIssueModel.find({
      schoolId,
      status: "Overdue",
    })
      .populate("bookId")
      .populate("borrowerId", "name email role phone profileImage")
      .sort({ dueDate: 1 })
      .limit(10);

    const overdueBooksList = overdueBooksListRaw.map((issue: any) => {
      const formatted = formatIssue(issue);
      if (formatted.borrowerId) {
        formatted.borrowerId.photo = formatted.borrowerId.profileImage || null;
      }
      return formatted;
    });

    // 6. Recent Activity (last 5 transactions)
    const recentActivityRaw = await BookIssueModel.find({ schoolId })
      .populate("bookId")
      .populate("borrowerId", "name email role phone profileImage")
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentActivity = recentActivityRaw.map((issue: any) => {
      const formatted = formatIssue(issue);
      if (formatted.borrowerId) {
        formatted.borrowerId.photo = formatted.borrowerId.profileImage || null;
      }
      return formatted;
    });

    // 7. Monthly stats (issues vs returns) for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const issuesPerMonth = await BookIssueModel.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId.toString()),
          issueDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$issueDate" },
            month: { $month: "$issueDate" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const returnsPerMonth = await BookIssueModel.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId.toString()),
          returnDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$returnDate" },
            month: { $month: "$returnDate" }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyStats: { month: string; issues: number; returns: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthNum = monthIndex + 1;
      const monthName = monthNames[monthIndex] || "";

      const issueMatch = issuesPerMonth.find(
        (item: any) => item._id.year === year && item._id.month === monthNum
      );
      const returnMatch = returnsPerMonth.find(
        (item: any) => item._id.year === year && item._id.month === monthNum
      );

      monthlyStats.push({
        month: monthName,
        issues: issueMatch ? issueMatch.count : 0,
        returns: returnMatch ? returnMatch.count : 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTitles,
          totalCopies,
          availableCopies,
          activeBorrowings,
          overdueBooksCount,
          totalFines,
        },
        overdueBooksList,
        recentActivity,
        monthlyStats,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Books CRUD ───────────────────────────────────────────────────────────────
export const createBook = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    const data = req.body;
    const numberOfCopies = data.numberOfCopies ?? 1;
    const availableCopies = data.availableCopies ?? numberOfCopies;

    if (availableCopies > numberOfCopies) {
      return res.status(400).json({ success: false, message: "Available copies cannot exceed total copies" });
    }

    let status = data.status || "Available";
    if (availableCopies === 0 && status === "Available") {
      status = "Out of Stock";
    }

    const book = new BookModel({
      ...data,
      schoolId,
      numberOfCopies,
      availableCopies,
      status,
    });

    const savedBook = await book.save();
    return res.status(201).json({ success: true, message: "Book created successfully", data: savedBook });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBooks = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    const { search, classId, status, type } = req.query as any;
    const query: any = { schoolId };

    if (classId) {
      query.classId = classId;
    }

    if (status) {
      query.status = status;
    }

    if (type === "out_of_stock") {
      query.$or = [{ availableCopies: 0 }, { status: "Out of Stock" }];
    } else if (type === "damaged_lost") {
      query.status = { $in: ["Damaged", "Lost"] };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: { $regex: searchRegex } },
        { authors: { $elemMatch: { $regex: searchRegex } } },
        { publisher: { $regex: searchRegex } },
      ];
    }

    const books = await BookModel.find(query)
      .populate("classId")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: { books } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookById = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    const book = await BookModel.findOne({ _id: req.params.id, schoolId }).populate("classId");
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    return res.status(200).json({ success: true, data: book });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBook = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    const book = await BookModel.findOne({ _id: req.params.id, schoolId });
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const data = req.body;
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        book[key] = data[key];
      }
    });

    if (book.availableCopies > book.numberOfCopies) {
      return res.status(400).json({ success: false, message: "Available copies cannot exceed total copies" });
    }

    if (book.availableCopies === 0 && book.status === "Available") {
      book.status = "Out of Stock";
    } else if (book.availableCopies > 0 && book.status === "Out of Stock") {
      book.status = "Available";
    }

    const updatedBook = await book.save();
    return res.status(200).json({ success: true, message: "Book updated successfully", data: updatedBook });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBook = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    const book = await BookModel.findOne({ _id: req.params.id, schoolId });
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const activeIssues = await BookIssueModel.exists({
      bookId: req.params.id,
      schoolId,
      status: { $in: ["Issued", "Overdue"] },
    });

    if (activeIssues) {
      return res.status(400).json({ success: false, message: "Cannot delete book with active, non-returned issues" });
    }

    await BookModel.deleteOne({ _id: req.params.id, schoolId });
    return res.status(200).json({ success: true, message: "Book deleted successfully", data: book });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Issues CRUD ──────────────────────────────────────────────────────────────
export const issueBook = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    const issuedByUserId = req.userId;
    if (!schoolId || !issuedByUserId) {
      return res.status(400).json({ success: false, message: "User context not found in session" });
    }

    const { bookId, borrowerId, dueDate, remarks } = req.body;

    const book = await BookModel.findOne({ _id: bookId, schoolId });
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    if (book.availableCopies <= 0 || book.status === "Out of Stock") {
      return res.status(400).json({ success: false, message: "Book is out of stock and cannot be issued" });
    }

    const borrower = await UserModel.findOne({ _id: borrowerId });
    if (!borrower) {
      return res.status(404).json({ success: false, message: "Borrower not found" });
    }

    if (borrower.role?.toUpperCase() === "PARENT") {
      return res.status(400).json({ success: false, message: "Parents are not allowed to borrow books" });
    }

    const existingIssue = await BookIssueModel.exists({
      schoolId,
      bookId,
      borrowerId,
      status: { $in: ["Issued", "Overdue"] },
    });

    if (existingIssue) {
      return res.status(400).json({ success: false, message: "This borrower already has an active issue for this book" });
    }

    // Generate unique issueId (ISS-XXXXX)
    let issueId = "";
    let exists = true;
    while (exists) {
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      issueId = `ISS-${rand}`;
      const count = await BookIssueModel.countDocuments({ schoolId, issueId });
      if (count === 0) {
        exists = false;
      }
    }

    book.availableCopies -= 1;
    if (book.availableCopies === 0) {
      book.status = "Out of Stock";
    } else {
      book.status = "Available";
    }
    await book.save();

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid due date" });
    }

    const bookIssue = new BookIssueModel({
      schoolId,
      bookId,
      borrowerId,
      issueId,
      issueDate: new Date(),
      dueDate: parsedDueDate,
      issuedBy: new mongoose.Types.ObjectId(issuedByUserId.toString()),
      status: "Issued",
      remarks,
    });

    const savedIssue = await bookIssue.save();
    return res.status(201).json({ success: true, message: "Book issued successfully", data: savedIssue });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getIssues = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    await BookIssueModel.updateMany(
      {
        schoolId,
        status: "Issued",
        dueDate: { $lt: new Date() },
      },
      {
        $set: { status: "Overdue" },
      }
    );

    const { search, status } = req.query as any;
    const query: any = { schoolId };

    if (status && status !== "all") {
      query.status = status;
    } else if (!status) {
      query.status = { $in: ["Issued", "Overdue"] };
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u: any) => u._id);

      const matchingBooks = await BookModel.find({
        schoolId,
        title: { $regex: searchRegex },
      }).select("_id");
      const bookIds = matchingBooks.map((b: any) => b._id);

      query.$or = [
        { issueId: { $regex: searchRegex } },
        { borrowerId: { $in: userIds } },
        { bookId: { $in: bookIds } },
      ];
    }

    const issuesRaw = await BookIssueModel.find(query)
      .populate("bookId")
      .populate("borrowerId", "name email role phone profileImage")
      .populate("issuedBy", "name email role")
      .populate("returnedBy", "name email role")
      .sort({ createdAt: -1 });

    const issues = issuesRaw.map((issue: any) => {
      const formatted = formatIssue(issue);
      if (formatted.borrowerId) {
        formatted.borrowerId.photo = formatted.borrowerId.profileImage || null;
      }
      return formatted;
    });

    return res.status(200).json({ success: true, data: { issues } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Returns CRUD ─────────────────────────────────────────────────────────────
export const returnBook = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    const returnedByUserId = req.userId;
    if (!schoolId || !returnedByUserId) {
      return res.status(400).json({ success: false, message: "User context not found in session" });
    }

    const { conditionOnReturn, fineAmount, remarks } = req.body;
    const issueId = req.params.id;

    const issue = await BookIssueModel.findOne({ _id: issueId, schoolId });
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue transaction record not found" });
    }

    if (issue.status === "Returned" || issue.status === "Lost" || issue.status === "Damaged") {
      return res.status(400).json({ success: false, message: "Book has already been returned" });
    }

    const book = await BookModel.findOne({ _id: issue.bookId, schoolId });
    if (!book) {
      return res.status(404).json({ success: false, message: "Associated book record not found" });
    }

    if (conditionOnReturn === "Good" || conditionOnReturn === "Damaged") {
      book.availableCopies += 1;
      if (book.availableCopies > book.numberOfCopies) {
        book.availableCopies = book.numberOfCopies;
      }
    } else if (conditionOnReturn === "Lost") {
      book.numberOfCopies = Math.max(0, book.numberOfCopies - 1);
    }

    if (book.availableCopies === 0) {
      book.status = "Out of Stock";
    } else if (book.status === "Out of Stock") {
      book.status = "Available";
    }
    await book.save();

    issue.status = conditionOnReturn === "Good" ? "Returned" : conditionOnReturn;
    issue.returnDate = new Date();
    issue.returnedBy = new mongoose.Types.ObjectId(returnedByUserId.toString());
    issue.conditionOnReturn = conditionOnReturn;
    issue.fineAmount = fineAmount;
    issue.remarks = remarks;

    const savedReturn = await issue.save();
    return res.status(200).json({ success: true, message: "Book returned successfully", data: savedReturn });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReturnsHistory = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID not found in session" });
    }

    const { search } = req.query as any;
    const query: any = {
      schoolId,
      returnDate: { $ne: null },
    };

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u: any) => u._id);

      const matchingBooks = await BookModel.find({
        schoolId,
        title: { $regex: searchRegex },
      }).select("_id");
      const bookIds = matchingBooks.map((b: any) => b._id);

      query.$or = [
        { issueId: { $regex: searchRegex } },
        { borrowerId: { $in: userIds } },
        { bookId: { $in: bookIds } },
      ];
    }

    const returnsRaw = await BookIssueModel.find(query)
      .populate("bookId")
      .populate("borrowerId", "name email role phone profileImage")
      .populate("issuedBy", "name email role")
      .populate("returnedBy", "name email role")
      .sort({ returnDate: -1 });

    const returns = returnsRaw.map((issue: any) => {
      const formatted = formatIssue(issue);
      if (formatted.borrowerId) {
        formatted.borrowerId.photo = formatted.borrowerId.profileImage || null;
      }
      return formatted;
    });

    return res.status(200).json({ success: true, data: { returns } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
