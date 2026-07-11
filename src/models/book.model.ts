import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  authors: string[];
  publisher: string;
  edition?: string;
  classId?: mongoose.Types.ObjectId;
  numberOfCopies: number;
  availableCopies: number;
  price?: number;
  purchaseDate?: Date;
  status: "Available" | "Out of Stock" | "Damaged" | "Lost" | "Borrowed";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authors: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    publisher: {
      type: String,
      required: true,
      trim: true,
    },
    edition: {
      type: String,
      trim: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    numberOfCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    price: {
      type: Number,
      min: 0,
    },
    purchaseDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Damaged", "Lost", "Borrowed"],
      default: "Available",
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({ schoolId: 1, title: 1 });

const bookModel = mongoose.models.Book ||
  mongoose.model<IBook>("Book", bookSchema);

export const BookModel = bookModel as any;
export default bookModel;
