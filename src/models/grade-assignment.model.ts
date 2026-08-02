import { Schema, Types, model, Document } from 'mongoose';

export interface IGradeEntry {
  studentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  theoryMarks: number | null;
  practicalMarks: number | null;
  totalMarks: number | null;
  isAbsent: boolean;
  remarks: string | null;
}

export interface IGradeAssignment extends Document {
  schoolId: Types.ObjectId;
  resultId: Types.ObjectId;
  examId: Types.ObjectId;
  teacherId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectId: Types.ObjectId;
  status: 'pending' | 'draft' | 'finalized';
  finalizedAt?: Date;
  entries: IGradeEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const gradeEntrySchema = new Schema<IGradeEntry>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'StudentEnrollment', required: true },
    theoryMarks: { type: Number, default: null },
    practicalMarks: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    isAbsent: { type: Boolean, default: false, required: true },
    remarks: { type: String, default: null },
  },
  { _id: false },
);

const gradeAssignmentSchema = new Schema<IGradeAssignment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    resultId: { type: Schema.Types.ObjectId, ref: 'Result', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    status: {
      type: String,
      enum: ['pending', 'draft', 'finalized'],
      default: 'pending',
      required: true,
    },
    finalizedAt: { type: Date, default: null },
    entries: [gradeEntrySchema],
  },
  { timestamps: true },
);

gradeAssignmentSchema.index({ resultId: 1, teacherId: 1 });
gradeAssignmentSchema.index({ resultId: 1, classId: 1, sectionId: 1, subjectId: 1 }, { unique: true });
gradeAssignmentSchema.index({ teacherId: 1, schoolId: 1, status: 1 });

export const GradeAssignment = model<IGradeAssignment>('GradeAssignment', gradeAssignmentSchema);
