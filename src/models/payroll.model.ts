import { Schema, model, Types } from "mongoose";

export interface IPayroll {
  payrollNumber: string; // PAY-202605-001
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  staffRole: string;
  month: number;
  year: number;
  basicSalary: number;
  totalAllowance: number;
  totalDeduction: number;
  netSalary: number;
  paymentStatus: "unpaid" | "paid";
  paymentMethod?: "cash" | "cheque" | "bank_transfer" | undefined;
  paymentDate?: Date | undefined;
  transactionReference?: string | undefined;
  generatedBy: Types.ObjectId;
  expenseId?: Types.ObjectId | undefined;
  deletedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>(
  {
    payrollNumber: { type: String, required: true, unique: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    staffRole: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true, min: 0 },
    totalAllowance: { type: Number, default: 0, min: 0 },
    totalDeduction: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "cheque", "bank_transfer"],
    },
    paymentDate: { type: Date },
    transactionReference: { type: String, trim: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expenseId: { type: Schema.Types.ObjectId, ref: "Expense" },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ schoolId: 1, month: 1, year: 1 });
payrollSchema.index({ schoolId: 1, userId: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = model<IPayroll>("Payroll", payrollSchema);
