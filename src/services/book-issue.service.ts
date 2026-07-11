import mongoose from 'mongoose';
import { BookIssueModel, IBookIssue } from '../models/book-issue.model';
import { BookModel } from '../models/book.model';
import { IBookIssueInput } from '../validators/book-issue.validator';

const cleanData = (obj: any): any => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const issueBook = async (
  schoolId: string,
  data: IBookIssueInput,
  issuedByUserId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const book = await BookModel.findOneAndUpdate(
      { _id: data.bookId, schoolId, availableQuantity: { $gt: 0 } },
      { $inc: { availableQuantity: -1 } },
      { session, new: true }
    );
    if (!book) {
      throw new Error('Book is not available or out of stock');
    }

    const issueData = cleanData({
      ...data,
      schoolId,
      issuedBy: issuedByUserId,
      status: 'issued',
    });

    const issue = await BookIssueModel.create([issueData as any], { session });
    await session.commitTransaction();
    return issue[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const returnBook = async (
  schoolId: string,
  issueId: string,
  data: { returnDate?: Date; fine?: number; notes?: string }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const issue = await BookIssueModel.findOne({ _id: issueId, schoolId }).session(session);
    if (!issue) {
      throw new Error('Issue record not found');
    }
    if (issue.status === 'returned') {
      throw new Error('Book has already been returned');
    }

    issue.status = 'returned';
    issue.returnDate = data.returnDate || new Date();
    issue.fine = data.fine || 0;
    if (data.notes) {
      issue.notes = data.notes;
    }

    await issue.save({ session });
    await BookModel.findOneAndUpdate(
      { _id: issue.bookId, schoolId },
      { $inc: { availableQuantity: 1 } },
      { session }
    );

    await session.commitTransaction();
    return issue;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getAllBookIssues = async (
  schoolId: string,
  filter?: { status?: string; studentId?: string; teacherId?: string; bookId?: string }
) => {
  const query: any = { schoolId };
  if (filter?.status) {
    query.status = filter.status;
  }
  if (filter?.studentId) {
    query.studentId = filter.studentId;
  }
  if (filter?.teacherId) {
    query.teacherId = filter.teacherId;
  }
  if (filter?.bookId) {
    query.bookId = filter.bookId;
  }

  const now = new Date();
  await BookIssueModel.updateMany(
    { schoolId, status: 'issued', dueDate: { $lt: now } },
    { $set: { status: 'overdue' } }
  );

  return await BookIssueModel.find(query)
    .populate('bookId')
    .populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email profileImage' },
    })
    .populate({
      path: 'teacherId',
      populate: { path: 'userId', select: 'name email profileImage' },
    })
    .populate('issuedBy', 'name email')
    .sort({ issueDate: -1 })
    .lean();
};

export const getLibrarianStats = async (schoolId: string) => {
  const now = new Date();
  await BookIssueModel.updateMany(
    { schoolId, status: 'issued', dueDate: { $lt: now } },
    { $set: { status: 'overdue' } }
  );

  const totalBooksResult = await BookModel.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        availableQuantity: { $sum: '$availableQuantity' },
        totalTitles: { $sum: 1 },
      },
    },
  ]);

  const activeIssuesCount = await BookIssueModel.countDocuments({
    schoolId,
    status: { $in: ['issued', 'overdue'] },
  });

  const overdueIssuesCount = await BookIssueModel.countDocuments({
    schoolId,
    status: 'overdue',
  });

  const stats = totalBooksResult[0] || { totalQuantity: 0, availableQuantity: 0, totalTitles: 0 };
  return {
    totalBooks: stats.totalQuantity,
    availableBooks: stats.availableQuantity,
    totalTitles: stats.totalTitles,
    activeIssues: activeIssuesCount,
    overdueIssues: overdueIssuesCount,
  };
};
