import {Schema,Types,model} from "mongoose";

export interface IAnnouncement {
  _id?: Types.ObjectId;
  schoolId: Types.ObjectId;
  title: string;
  content: string;
  audience: "all" | "teachers" | "staffs" | "students" | "parents";
  showOnLogin: boolean;
  loginMessageExpiry?: Date | null;
  createdBy: Types.ObjectId;
  targetClassId?: Types.ObjectId | null;
  targetSectionId?: Types.ObjectId | null;
  readBy?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  audience: {
    type: String,
    enum: ["all", "teachers", "staffs", "students", "parents"],
    default: "all",
  },
  showOnLogin: { type: Boolean, default: false },
  loginMessageExpiry: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  targetClassId: { type: Schema.Types.ObjectId, ref: "Class", default: null },
  targetSectionId: { type: Schema.Types.ObjectId, ref: "Section", default: null },
  readBy: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

announcementSchema.index({ schoolId: 1, createdAt: -1 });

export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);
