import { Schema, model, Types } from "mongoose";

export interface IFeeStructure {
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  classId: Types.ObjectId;
  monthlyFee: number;
  createdById: Types.ObjectId;
  status: "active" | "inactive";
  deletedAt?: Date | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const feeStructureSchema = new Schema<IFeeStructure>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    monthlyFee: { type: Number, required: true, min: 0 },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

feeStructureSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, deletedAt: 1 });

export const FeeStructure = model<IFeeStructure>("FeeStructure", feeStructureSchema);
