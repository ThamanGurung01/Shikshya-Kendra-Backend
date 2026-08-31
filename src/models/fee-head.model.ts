import { Schema, model, Types } from "mongoose";

export interface IFeeHead {
  schoolId: Types.ObjectId;
  title: string; // e.g. "Exam Fee", "Identity Card Fee", "Diary Fee"
  feeType: "monthly" | "one_time" | "term_wise";
  defaultAmount: number;
  applicableMonth?: number | undefined; // 1-12 (e.g. Month 1 = Baishakh exam fee)
  applicableClassIds?: Types.ObjectId[] | undefined; // Empty = all classes
  createdAt: Date;
  updatedAt: Date;
}

const feeHeadSchema = new Schema<IFeeHead>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    title: { type: String, required: true, trim: true },
    feeType: { type: String, enum: ["monthly", "one_time", "term_wise"], default: "monthly" },
    defaultAmount: { type: Number, required: true, min: 0 },
    applicableMonth: { type: Number, min: 1, max: 12 },
    applicableClassIds: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  },
  {
    timestamps: true,
  }
);

feeHeadSchema.index({ schoolId: 1, title: 1 });

export const FeeHead = model<IFeeHead>("FeeHead", feeHeadSchema);
