import { Schema, Types, model } from 'mongoose';

export interface ISection {
  schoolId: Types.ObjectId;
  classId: Types.ObjectId;
  name: string;
}

const sectionSchema = new Schema<ISection>(
  {
    schoolId: { type: Types.ObjectId, ref: 'School', required: true },
    classId: { type: Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export const SectionModel = model<ISection>('Section', sectionSchema);