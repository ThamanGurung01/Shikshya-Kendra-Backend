import { Schema, model, Types } from "mongoose";

export interface ISalaryItem {
  title: string;
  amount: number;
}

export interface IStaffSalaryConfig {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  staffRole: "teacher" | "accountant" | "librarian" | "admin" | "staff";
  staffRefId?: Types.ObjectId | undefined;
  basicSalary: number;
  allowances: ISalaryItem[]; // e.g. Medical, Transport, Bonus
  deductions: ISalaryItem[]; // e.g. Advance Salary Adjustment, Unpaid Leave
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const salaryItemSchema = new Schema<ISalaryItem>(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const staffSalaryConfigSchema = new Schema<IStaffSalaryConfig>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    staffRole: {
      type: String,
      enum: ["teacher", "accountant", "librarian", "admin", "staff"],
      required: true,
    },
    staffRefId: { type: Schema.Types.ObjectId },
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: [salaryItemSchema],
    deductions: [salaryItemSchema],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    timestamps: true,
  }
);

staffSalaryConfigSchema.index({ schoolId: 1, userId: 1 }, { unique: true });

export const StaffSalaryConfig = model<IStaffSalaryConfig>(
  "StaffSalaryConfig",
  staffSalaryConfigSchema
);
