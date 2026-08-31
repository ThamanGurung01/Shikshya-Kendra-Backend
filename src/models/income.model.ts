import { Schema, model, Types } from "mongoose";

export interface IIncome {
  voucherNumber: string; // INC-2026-0001
  schoolId: Types.ObjectId;
  category: string; // "Student Fee", "Grant", "Canteen Rent", "Donation", "Miscellaneous"
  title: string;
  amount: number;
  discountAmount?: number | undefined;
  netAmount: number;
  paymentMethod: "cash" | "bank_transfer" | "cheque" | "esewa";
  date: Date;
  description?: string | undefined;
  invoiceId?: Types.ObjectId | undefined;
  receiptUrl?: string | undefined;
  createdById: Types.ObjectId;
  deletedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const incomeSchema = new Schema<IIncome>(
  {
    voucherNumber: { type: String, required: true, unique: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "cheque", "esewa"],
      default: "cash",
    },
    date: { type: Date, default: Date.now, index: true },
    description: { type: String, trim: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "FeeInvoice" },
    receiptUrl: { type: String },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

incomeSchema.index({ schoolId: 1, date: -1 });

export const Income = model<IIncome>("Income", incomeSchema);
