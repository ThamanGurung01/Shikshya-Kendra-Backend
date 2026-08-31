import { Schema, model, Types } from "mongoose";

export interface IExpense {
  voucherNumber: string; // EXP-2026-0001
  schoolId: Types.ObjectId;
  category: string; // "Salary", "Electricity", "Water", "Internet", "Maintenance", "Supplies", "Event", "Miscellaneous"
  title: string;
  amount: number;
  discountAmount?: number | undefined;
  netAmount: number;
  paymentMethod: "cash" | "bank_transfer" | "cheque" | "online";
  date: Date;
  description?: string | undefined;
  payrollId?: Types.ObjectId | undefined;
  receiptUrl?: string | undefined;
  createdById: Types.ObjectId;
  deletedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
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
      enum: ["cash", "bank_transfer", "cheque", "online"],
      default: "cash",
    },
    date: { type: Date, default: Date.now, index: true },
    description: { type: String, trim: true },
    payrollId: { type: Schema.Types.ObjectId, ref: "Payroll" },
    receiptUrl: { type: String },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ schoolId: 1, date: -1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
