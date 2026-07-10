import { Schema, Types, model, Document } from "mongoose";

export interface IAssignment extends Document {
  schoolId: Types.ObjectId;
  teacherId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectId: Types.ObjectId;
  title: string;
  description: string;
  files: string[];
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    files: [{ type: String }],
    dueDate: { type: Date, required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

assignmentSchema.index({ schoolId: 1, classId: 1, sectionId: 1 });
assignmentSchema.index({ teacherId: 1 });

export const Assignment = model<IAssignment>("Assignment", assignmentSchema);
