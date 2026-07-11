import "dotenv/config";
import mongoose from "mongoose";
import Book from "../models/book.model";
import BookIssue from "../models/book-issue.model";
import { School } from "../models/school.model";
import { ClassModel as Class } from "../models/class.model";
import { User } from "../models/user.model";

const BookModel = Book as any;
const BookIssueModel = BookIssue as any;

const seedBooks = async () => {
  try {
    const school = await School.findOne({ school_email: "info@shikshyakendra.edu.np" });
    if (!school) {
      console.error("No school found. Please run school.ts seeder first.");
      process.exit(1);
    }
    const schoolId = school._id;
    console.log(`Using school: ${school.school_name} (${schoolId})`);

    console.log("Purging old library-related data...");
    await BookModel.deleteMany({ schoolId });
    await BookIssueModel.deleteMany({ schoolId });

    // Fetch classes
    const classes = await Class.find({ schoolId });
    const classMap = new Map<string, mongoose.Types.ObjectId>();
    classes.forEach((cls) => {
      classMap.set(cls.name, cls._id as mongoose.Types.ObjectId);
    });

    const bookData = [
      {
        title: "Muna Madan",
        authors: ["Laxmi Prasad Devkota"],
        publisher: "Sajha Prakashan",
        edition: "15th",
        numberOfCopies: 5,
        price: 150,
        remarks: "Nepali classic literature",
      },
      {
        title: "Introduction to Algorithms",
        authors: ["Thomas H. Cormen", "Charles E. Leiserson", "Ronald L. Rivest", "Clifford Stein"],
        publisher: "MIT Press",
        edition: "4th",
        numberOfCopies: 3,
        price: 4500,
        remarks: "Reference book for Computer Science",
      },
      {
        title: "The Alchemist",
        authors: ["Paulo Coelho"],
        publisher: "HarperOne",
        edition: "1st",
        numberOfCopies: 10,
        price: 500,
        remarks: "Inspirational novel",
      },
      {
        title: "Sapiens: A Brief History of Humankind",
        authors: ["Yuval Noah Harari"],
        publisher: "Harper",
        edition: "1st",
        numberOfCopies: 4,
        price: 800,
        remarks: "Popular science and history",
      },
      {
        title: "Basic Mathematics - Class 9",
        authors: ["DR Bajracharya"],
        publisher: "Sukunda Pustak Bhandar",
        edition: "2024",
        classId: classMap.get("Class 9"),
        numberOfCopies: 15,
        price: 350,
        remarks: "Textbook for Class 9",
      },
      {
        title: "Principles of Physics - Class 10",
        authors: ["Halliday", "Resnick", "Walker"],
        publisher: "Wiley",
        edition: "10th",
        classId: classMap.get("Class 10"),
        numberOfCopies: 12,
        price: 1200,
        remarks: "Reference Physics book for Class 10",
      },
      {
        title: "Science and Technology - Class 8",
        authors: ["Curriculum Development Centre"],
        publisher: "CDC Nepal",
        edition: "2025",
        classId: classMap.get("Class 8"),
        numberOfCopies: 25,
        price: 250,
        remarks: "Government textbook",
      },
      {
        title: "Social Studies - Class 7",
        authors: ["CDC Nepal"],
        publisher: "CDC Nepal",
        edition: "2025",
        classId: classMap.get("Class 7"),
        numberOfCopies: 25,
        price: 220,
        remarks: "Government textbook",
      },
      {
        title: "Nepali Kitab - Class 6",
        authors: ["Janak Education Materials"],
        publisher: "JEMC",
        edition: "2025",
        classId: classMap.get("Class 6"),
        numberOfCopies: 30,
        price: 180,
        remarks: "Government textbook",
      },
      {
        title: "Computer Science - Class 9",
        authors: ["Nepal Board Authors"],
        publisher: "Sukunda Pustak",
        edition: "2024",
        classId: classMap.get("Class 9"),
        numberOfCopies: 15,
        price: 280,
        remarks: "Textbook for Class 9 computer",
      },
      {
        title: "To Kill a Mockingbird",
        authors: ["Harper Lee"],
        publisher: "J. B. Lippincott & Co.",
        edition: "50th Anniversary",
        numberOfCopies: 5,
        price: 600,
      },
      {
        title: "1984",
        authors: ["George Orwell"],
        publisher: "Secker & Warburg",
        edition: "Reprint",
        numberOfCopies: 8,
        price: 450,
        remarks: "Dystopian fiction classic",
      },
      {
        title: "The Great Gatsby",
        authors: ["F. Scott Fitzgerald"],
        publisher: "Charles Scribner's Sons",
        edition: "Modern Library",
        numberOfCopies: 6,
        price: 400,
      },
      {
        title: "A Brief History of Time",
        authors: ["Stephen Hawking"],
        publisher: "Bantam Books",
        edition: "Updated",
        numberOfCopies: 4,
        price: 750,
      },
      {
        title: "Cosmos",
        authors: ["Carl Sagan"],
        publisher: "Random House",
        edition: "First",
        numberOfCopies: 5,
        price: 900,
      },
      {
        title: "Hamlet",
        authors: ["William Shakespeare"],
        publisher: "Simon & Schuster",
        edition: "Folger Shakespeare Library",
        numberOfCopies: 10,
        price: 350,
      },
      {
        title: "The Catcher in the Rye",
        authors: ["J.D. Salinger"],
        publisher: "Little, Brown and Company",
        edition: "Mass Market",
        numberOfCopies: 7,
        price: 400,
      },
      {
        title: "Pride and Prejudice",
        authors: ["Jane Austen"],
        publisher: "T. Egerton, Whitehall",
        edition: "Wordsworth Classics",
        numberOfCopies: 8,
        price: 300,
      },
      {
        title: "The Hobbit",
        authors: ["J.R.R. Tolkien"],
        publisher: "Allen & Unwin",
        edition: "Collector's",
        numberOfCopies: 6,
        price: 850,
      },
      {
        title: "English Grammar & Composition",
        authors: ["Wren", "Martin"],
        publisher: "S. Chand Publishing",
        edition: "Revised",
        numberOfCopies: 20,
        price: 450,
        remarks: "Reference grammar book",
      },
      {
        title: "Advanced Calculus",
        authors: ["Gerald B. Folland"],
        publisher: "Pearson",
        edition: "1st",
        numberOfCopies: 2,
        price: 3200,
      },
      {
        title: "Organic Chemistry",
        authors: ["Morrison", "Boyd"],
        publisher: "Prentice Hall",
        edition: "7th",
        numberOfCopies: 3,
        price: 2800,
      },
    ];

    console.log(`Inserting ${bookData.length} books...`);
    const books: any[] = [];
    for (const b of bookData) {
      const book = await new BookModel({
        ...b,
        schoolId,
        availableCopies: b.numberOfCopies,
        status: "Available",
        purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random purchase date in last 1 year
      }).save();
      books.push(book);
    }
    console.log("Books created successfully!");

    // Fetch Librarian user to be the issuer/returner
    const librarianUser = await User.findOne({ role: "librarian" });
    if (!librarianUser) {
      console.error("Librarian user not found. Run school seeder first.");
      return;
    }

    // Fetch Student and Teacher users to be borrowers
    const studentUsers = await User.find({ role: "student" }).limit(30);
    const teacherUsers = await User.find({ role: "teacher" }).limit(10);
    const potentialBorrowers = [...studentUsers, ...teacherUsers];

    if (potentialBorrowers.length === 0) {
      console.error("No student or teacher users found to borrow books.");
      return;
    }

    console.log("Seeding book issues and returns history...");
    
    // We want to create:
    // 1. 5 Returned book issues (some with fine)
    // 2. 5 Issued books (active, due date in future)
    // 3. 4 Overdue book issues (due date in past)
    // For each issue we must generate a unique issueId

    const getRandomBorrower = () => potentialBorrowers[Math.floor(Math.random() * potentialBorrowers.length)]!;
    
    const generateIssueId = async (): Promise<string> => {
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
      return issueId;
    };

    // Helper to edit the available copies of a book
    const decrementBookCopies = async (bookId: mongoose.Types.ObjectId) => {
      const book = await BookModel.findById(bookId);
      if (book) {
        book.availableCopies = Math.max(0, book.availableCopies - 1);
        if (book.availableCopies === 0) {
          book.status = "Out of Stock";
        } else {
          book.status = "Available";
        }
        await book.save();
      }
    };

    // ─── 1. Returned Issues (5 items) ───
    for (let i = 0; i < 5; i++) {
      const book = books[i % books.length]!;
      const borrower = getRandomBorrower();
      const issueId = await generateIssueId();

      const daysAgoIssued = 15 + i;
      const daysAgoReturned = 2 + i;
      
      const issueDate = new Date(Date.now() - daysAgoIssued * 24 * 60 * 60 * 1000);
      const dueDate = new Date(Date.now() - (daysAgoIssued - 10) * 24 * 60 * 60 * 1000); // 10 days borrow limit
      const returnDate = new Date(Date.now() - daysAgoReturned * 24 * 60 * 60 * 1000);

      // Fine calculation if returned after due date
      let fineAmount = 0;
      if (returnDate > dueDate) {
        const diffTime = Math.abs(returnDate.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fineAmount = diffDays * 10; // 10 Rupees per day fine
      }

      await new BookIssueModel({
        schoolId,
        bookId: book._id,
        borrowerId: borrower._id,
        issueId,
        issueDate,
        dueDate,
        issuedBy: librarianUser._id,
        status: "Returned",
        returnDate,
        returnedBy: librarianUser._id,
        conditionOnReturn: i % 4 === 0 ? "Damaged" : "Good",
        fineAmount,
        remarks: i % 4 === 0 ? "Returned with slight cover damage" : "Returned in good condition",
      }).save();
    }

    // ─── 2. Active Issued Books (5 items) ───
    for (let i = 0; i < 5; i++) {
      const book = books[(i + 5) % books.length]!;
      // Ensure we don't issue a book if availableCopies is 0
      if (book.availableCopies > 0) {
        const borrower = getRandomBorrower();
        const issueId = await generateIssueId();

        const daysAgoIssued = 2 + i;
        const issueDate = new Date(Date.now() - daysAgoIssued * 24 * 60 * 60 * 1000);
        const dueDate = new Date(Date.now() + (10 - daysAgoIssued) * 24 * 60 * 60 * 1000); // due in future

        await new BookIssueModel({
          schoolId,
          bookId: book._id,
          borrowerId: borrower._id,
          issueId,
          issueDate,
          dueDate,
          issuedBy: librarianUser._id,
          status: "Issued",
          fineAmount: 0,
        }).save();

        await decrementBookCopies(book._id);
      }
    }

    // ─── 3. Overdue Issues (4 items) ───
    for (let i = 0; i < 4; i++) {
      const book = books[(i + 10) % books.length]!;
      if (book.availableCopies > 0) {
        const borrower = getRandomBorrower();
        const issueId = await generateIssueId();

        const daysAgoIssued = 12 + i;
        const issueDate = new Date(Date.now() - daysAgoIssued * 24 * 60 * 60 * 1000);
        const dueDate = new Date(Date.now() - (daysAgoIssued - 7) * 24 * 60 * 60 * 1000); // due date was in past

        // calculate prospective fine
        const diffTime = Math.abs(Date.now() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fineAmount = diffDays * 10;

        await new BookIssueModel({
          schoolId,
          bookId: book._id,
          borrowerId: borrower._id,
          issueId,
          issueDate,
          dueDate,
          issuedBy: librarianUser._id,
          status: "Overdue",
          fineAmount,
          remarks: "Urgent return reminder sent",
        }).save();

        await decrementBookCopies(book._id);
      }
    }

    console.log("Book issues and returns history seeded successfully!");
    console.log("Library seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding library data:", error);
    throw error;
  }
};

export { seedBooks };

if (require.main === module) {
  const { connectDB, closeDB } = require("../configs/db");
  (async () => {
    await connectDB();
    await seedBooks();
    await closeDB();
  })();
}
