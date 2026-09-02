import { Schema, Types, model } from 'mongoose';

export interface IClass {
  schoolId: Types.ObjectId;
  name: string;
}

const classSchema = new Schema<IClass>(
  {
    schoolId: { type: Types.ObjectId, ref: 'School', required: true },
    name: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
);

export const ClassModel = model<IClass>('Class', classSchema);
export const Class = ClassModel;