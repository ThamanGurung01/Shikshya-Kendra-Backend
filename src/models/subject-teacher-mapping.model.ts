import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubjectTeacherMapping extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  periodsPerWeek: number;
}

const subjectTeacherMappingSchema = new Schema<ISubjectTeacherMapping>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    periodsPerWeek: { type: Number, required: true, min: 1, max: 30 },
  },
  { timestamps: true },
);

subjectTeacherMappingSchema.index(
  { schoolId: 1, classId: 1, sectionId: 1, subjectId: 1 },
  { unique: true },
);

export const SubjectTeacherMapping =
  (mongoose.models.SubjectTeacherMapping as Model<ISubjectTeacherMapping>) ||
  mongoose.model<ISubjectTeacherMapping>('SubjectTeacherMapping', subjectTeacherMappingSchema);

export default SubjectTeacherMapping;