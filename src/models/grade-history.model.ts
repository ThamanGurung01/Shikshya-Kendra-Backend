import { Schema, Types, model, Document } from 'mongoose';

export interface IGradeHistory extends Document {
  schoolId: Types.ObjectId;
  resultId: Types.ObjectId;
  gradeAssignmentId: Types.ObjectId;
  examId: Types.ObjectId;
  studentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  theoryMarks?: number;
  practicalMarks?: number;
  totalMarks?: number;
  theoryFullMarks: number;
  practicalFullMarks: number;
  isAbsent: boolean;
  remarks?: string;
  version: number;
  gradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gradeHistorySchema = new Schema<IGradeHistory>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    resultId: { type: Schema.Types.ObjectId, ref: 'Result', required: true },
    gradeAssignmentId: { type: Schema.Types.ObjectId, ref: 'GradeAssignment', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'StudentEnrollment', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    theoryMarks: { type: Number, default: null },
    practicalMarks: { type: Number, default: null },
    totalMarks: { type: Number, default: null },
    theoryFullMarks: { type: Number, required: true },
    practicalFullMarks: { type: Number, required: true },
    isAbsent: { type: Boolean, default: false, required: true },
    remarks: { type: String, default: null },
    version: { type: Number, required: true, default: 1 },
    gradedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Fast per-student history lookup
gradeHistorySchema.index({ resultId: 1, studentId: 1, subjectId: 1, version: 1 });
// Student's full history across all exams
gradeHistorySchema.index({ studentId: 1, schoolId: 1 });
// Trace back to source assignment
gradeHistorySchema.index({ gradeAssignmentId: 1, version: 1 });

export const GradeHistory = model<IGradeHistory>('GradeHistory', gradeHistorySchema);
