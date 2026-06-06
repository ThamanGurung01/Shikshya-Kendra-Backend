import { Schema, Types, model } from 'mongoose';

export interface ISubject {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  name: string;
  code: string;
}

const subjectSchema = new Schema<ISubject>(
  {
    schoolId: { type: Types.ObjectId, ref: 'School', required: true },
    classId: { type: Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export const SubjectModel = model<ISubject>('Subject', subjectSchema);