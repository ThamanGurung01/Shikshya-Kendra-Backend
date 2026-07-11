import mongoose, { Schema, Document } from "mongoose";

export interface IBookIssue extends Document {
  schoolId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  issueId: string;
  issueDate: Date;
  dueDate: Date;
  issuedBy: mongoose.Types.ObjectId;
  status: "Issued" | "Returned" | "Overdue" | "Lost" | "Damaged";
  returnDate?: Date;
  returnedBy?: mongoose.Types.ObjectId;
  conditionOnReturn?: "Good" | "Damaged" | "Lost";
  fineAmount: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookIssueSchema = new Schema<IBookIssue>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issueId: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Issued", "Returned", "Overdue", "Lost", "Damaged"],
      default: "Issued",
    },
    returnDate: {
      type: Date,
    },
    returnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    conditionOnReturn: {
      type: String,
      enum: ["Good", "Damaged", "Lost"],
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

bookIssueSchema.index({ schoolId: 1, issueId: 1 }, { unique: true });
bookIssueSchema.index({ schoolId: 1, borrowerId: 1 });
bookIssueSchema.index({ schoolId: 1, bookId: 1 });

const bookIssueModel = mongoose.models.BookIssue ||
  mongoose.model<IBookIssue>("BookIssue", bookIssueSchema);

export const BookIssueModel = bookIssueModel as any;
export default bookIssueModel;
