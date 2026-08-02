import { Schema, Types, model, Document } from 'mongoose';

export interface IResult extends Document {
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  examId: Types.ObjectId;
  name: string;
  classIds: Types.ObjectId[];
  status: 'processing' | 'draft' | 'published';
  publishedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    name: { type: String, required: true, trim: true },
    classIds: [{ type: Schema.Types.ObjectId, ref: 'Class', required: true }],
    status: {
      type: String,
      enum: ['processing', 'draft', 'published'],
      default: 'processing',
      required: true,
    },
    publishedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

resultSchema.index({ schoolId: 1, examId: 1 }, { unique: true });
resultSchema.index({ schoolId: 1, status: 1 });

export const ResultModel = model<IResult>('Result', resultSchema);
