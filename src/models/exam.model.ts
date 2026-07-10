import { Schema, Types, model } from 'mongoose';

export interface IExam {
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  name: string;
  classes: Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  allowedDays: string[];
  startTime: string;
  endTime: string;
  status: 'draft' | 'upcoming' | 'active' | 'ended';
}

const examSchema = new Schema<IExam>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    name: { type: String, required: true },
    classes: [{ type: Schema.Types.ObjectId, ref: 'Class', required: true }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    allowedDays: [{ type: String, required: true }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'ended'],
      default: 'draft',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ExamModel = model<IExam>('Exam', examSchema);
