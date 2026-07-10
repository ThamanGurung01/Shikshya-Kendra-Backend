import { Schema, Types, model, Document } from "mongoose";

export interface IAssignmentSubmission extends Document {
  schoolId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: "PENDING" | "SUBMITTED" | "COMPLETED" | "REDO";
  studentNote?: string;
  files: string[];
  feedback?: string;
  isViewed: boolean;
  submittedAt?: Date;
  checkedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "SUBMITTED", "COMPLETED", "REDO"],
      default: "PENDING",
      required: true,
    },
    studentNote: { type: String, default: null },
    files: [{ type: String }],
    feedback: { type: String, default: null },
    isViewed: { type: Boolean, default: false, required: true },
    submittedAt: { type: Date, default: null },
    checkedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ schoolId: 1, studentId: 1, status: 1 });

export const AssignmentSubmission = model<IAssignmentSubmission>("AssignmentSubmission", assignmentSubmissionSchema);
