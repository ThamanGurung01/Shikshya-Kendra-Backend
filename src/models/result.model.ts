import { Schema, Types, model, Document } from 'mongoose';

export interface IWlmScore {
  studentId: Types.ObjectId;
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  examScore: number;
  attendanceScore: number;
  assignmentScore: number;
  conductScore?: number;
  punctualityScore?: number;
  comprehensiveScore: number;
  classRank?: number;
  sectionRank?: number;
  performanceTier?: 'TOP_PERFORMER' | 'AVERAGE' | 'NEEDS_GUIDANCE';
}

export interface IResult extends Document {
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  examId: Types.ObjectId;
  name: string;
  classIds: Types.ObjectId[];
  status: 'processing' | 'draft' | 'published';
  publishedAt?: Date;
  createdBy: Types.ObjectId;
  wlmScores?: IWlmScore[];
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
    wlmScores: [{
      studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
      classId: { type: Schema.Types.ObjectId, ref: 'Class' },
      sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
      examScore: { type: Number, required: true },
      attendanceScore: { type: Number, required: true },
      assignmentScore: { type: Number, required: true },
      conductScore: { type: Number, default: 100 },
      punctualityScore: { type: Number, default: 100 },
      comprehensiveScore: { type: Number, required: true },
      classRank: { type: Number, default: 1 },
      sectionRank: { type: Number, default: 1 },
      performanceTier: {
        type: String,
        enum: ['TOP_PERFORMER', 'AVERAGE', 'NEEDS_GUIDANCE'],
        default: 'AVERAGE',
      },
    }],
  },
  { timestamps: true },
);

resultSchema.index({ schoolId: 1, examId: 1 }, { unique: true });
resultSchema.index({ schoolId: 1, status: 1 });

export const ResultModel = model<IResult>('Result', resultSchema);
