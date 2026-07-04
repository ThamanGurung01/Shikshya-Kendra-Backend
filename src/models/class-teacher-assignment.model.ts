import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IClassTeacherAssignment extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
}

const classTeacherAssignmentSchema = new Schema<IClassTeacherAssignment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  },
  { timestamps: true },
);

classTeacherAssignmentSchema.index(
  { schoolId: 1, classId: 1, sectionId: 1 },
  { unique: true },
);

export const ClassTeacherAssignment =
  (mongoose.models.ClassTeacherAssignment as Model<IClassTeacherAssignment>) ||
  mongoose.model<IClassTeacherAssignment>('ClassTeacherAssignment', classTeacherAssignmentSchema);

export default ClassTeacherAssignment;