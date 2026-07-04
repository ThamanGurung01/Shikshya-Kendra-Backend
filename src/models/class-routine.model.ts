import mongoose, { Document, Model, Schema } from 'mongoose';
import type { RoutineDay } from './school-schedule-config.model';

export interface IClassRoutine extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  dayOfWeek: RoutineDay;
  position: number;
  startTime: string;
  endTime: string;
  slotType: 'SUBJECT' | 'BREAK' | 'NA';
  subjectId?: mongoose.Types.ObjectId | null;
  teacherId?: mongoose.Types.ObjectId | null;
  roomNumber?: string;
}

const classRoutineSchema = new Schema<IClassRoutine>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    position: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotType: { type: String, enum: ['SUBJECT', 'BREAK', 'NA'], required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', default: null },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', default: null },
    roomNumber: { type: String, default: '' },
  },
  { timestamps: true },
);

classRoutineSchema.index(
  { schoolId: 1, classId: 1, sectionId: 1, dayOfWeek: 1, position: 1 },
  { unique: true },
);

export const ClassRoutine =
  (mongoose.models.ClassRoutine as Model<IClassRoutine>) ||
  mongoose.model<IClassRoutine>('ClassRoutine', classRoutineSchema);

export default ClassRoutine;