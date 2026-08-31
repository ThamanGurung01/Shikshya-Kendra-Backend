import { Schema, model, Types } from "mongoose";

export interface IStudentFeeConfig {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  customMonthlyFee?: number | null | undefined; // Null means use class default
  discountType: "none" | "percentage" | "flat";
  discountValue: number; // e.g. 20 for 20% or 500 for NRs 500
  discountReason?: string | undefined;
  hasTransport: boolean;
  transportFee: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const studentFeeConfigSchema = new Schema<IStudentFeeConfig>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    customMonthlyFee: { type: Number, default: null },
    discountType: { type: String, enum: ["none", "percentage", "flat"], default: "none" },
    discountValue: { type: Number, default: 0, min: 0 },
    discountReason: { type: String, trim: true },
    hasTransport: { type: Boolean, default: false },
    transportFee: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    timestamps: true,
  }
);

studentFeeConfigSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });

export const StudentFeeConfig = model<IStudentFeeConfig>("StudentFeeConfig", studentFeeConfigSchema);
