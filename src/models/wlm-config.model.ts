import { Schema, Types, model, Document } from 'mongoose';

export interface IWlmConfig extends Document {
  schoolId: Types.ObjectId;
  examWeight: number;
  attendanceWeight: number;
  assignmentWeight: number;
  conductWeight: number;
  punctualityWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

const wlmConfigSchema = new Schema<IWlmConfig>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
    examWeight: { type: Number, default: 0.75, min: 0, max: 1 },
    attendanceWeight: { type: Number, default: 0.10, min: 0, max: 1 },
    assignmentWeight: { type: Number, default: 0.15, min: 0, max: 1 },
    conductWeight: { type: Number, default: 0, min: 0, max: 1 },
    punctualityWeight: { type: Number, default: 0, min: 0, max: 1 },
  },
  { timestamps: true },
);

// Ensure weights always sum to 1.0
wlmConfigSchema.pre('save', async function () {
  const sum =
    this.examWeight +
    this.attendanceWeight +
    this.assignmentWeight +
    (this.conductWeight ?? 0) +
    (this.punctualityWeight ?? 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`Weights must sum to 1.0 (got ${sum.toFixed(3)})`);
  }
});

export const WlmConfig = model<IWlmConfig>('WlmConfig', wlmConfigSchema);
