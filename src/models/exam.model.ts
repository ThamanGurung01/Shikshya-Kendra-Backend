import { Schema, Types, model } from 'mongoose';

export interface IExamSubjectConfig {
  subjectId: Types.ObjectId;
  theoryFullMarks: number;
  theoryPassMarks: number;
  practicalFullMarks: number;
  practicalPassMarks: number;
}

export interface IExamClassConfig {
  classId: Types.ObjectId;
  subjects: IExamSubjectConfig[];
}

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
  actualEndDate?: Date;
  note?: string;
  classTimes?: { classId: Types.ObjectId; startTime: string; endTime: string }[];
  status: 'draft' | 'upcoming' | 'active' | 'ended';
  gradingSystem: 'gpa' | 'percentage';
  examType?: 'terminal' | 'formative' | 'practice';
  isMajorExam?: boolean;
  annualContributionWeight?: number;
  examConfiguration?: IExamClassConfig[];
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
    actualEndDate: { type: Date },
    note: { type: String },
    classTimes: [
      {
        classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'ended'],
      default: 'draft',
      required: true,
    },
    gradingSystem: {
      type: String,
      enum: ['gpa', 'percentage'],
      default: 'gpa',
      required: true,
    },
    examType: {
      type: String,
      enum: ['terminal', 'formative', 'practice'],
      default: 'terminal',
    },
    isMajorExam: {
      type: Boolean,
      default: true,
    },
    annualContributionWeight: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    examConfiguration: [
      {
        classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
        subjects: [
          {
            subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
            theoryFullMarks: { type: Number, default: 75 },
            theoryPassMarks: { type: Number, default: 30 },
            practicalFullMarks: { type: Number, default: 25 },
            practicalPassMarks: { type: Number, default: 10 },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const ExamModel = model<IExam>('Exam', examSchema);
