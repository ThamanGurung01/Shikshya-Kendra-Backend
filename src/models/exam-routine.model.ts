import { Schema, Types, model } from 'mongoose';

export interface IExamRoutine {
  schoolId: Types.ObjectId;
  examId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  roomNumber?: string;
}

const examRoutineSchema = new Schema<IExamRoutine>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    roomNumber: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

examRoutineSchema.index({ examId: 1, classId: 1 });

export const ExamRoutineModel = model<IExamRoutine>('ExamRoutine', examRoutineSchema);
