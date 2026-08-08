import { Schema, Types, model, Document } from 'mongoose';

export interface IWlmConfig extends Document {
  schoolId: Types.ObjectId;
  examWeight: number;
  attendanceWeight: number;
  assignmentWeight: number;
  createdAt: Date;
  updatedAt: Date;
}

const wlmConfigSchema = new Schema<IWlmConfig>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
    examWeight: { type: Number, default: 0.50, min: 0, max: 1 },
    attendanceWeight: { type: Number, default: 0.30, min: 0, max: 1 },
    assignmentWeight: { type: Number, default: 0.20, min: 0, max: 1 },
  },
  { timestamps: true },
);

// Ensure weights always sum to 1.0
wlmConfigSchema.pre('save', async function () {
  const sum = this.examWeight + this.attendanceWeight + this.assignmentWeight;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(`Weights must sum to 1.0 (got ${sum})`);
  }
});

export const WlmConfig = model<IWlmConfig>('WlmConfig', wlmConfigSchema);
