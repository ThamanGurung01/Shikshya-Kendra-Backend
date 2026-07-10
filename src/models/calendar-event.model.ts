import {Schema,Types,model} from "mongoose";

export interface ICalendarEvent {
  _id?: Types.ObjectId;
  schoolId: Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  category: "holiday" | "program" | "sports_day" | "exam" | "other";
  isHoliday: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    category: {
      type: String,
      enum: ["holiday", "program", "sports_day", "exam", "other"],
      default: "other",
    },
    isHoliday: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { 
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
  },
);

calendarEventSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });

export const CalendarEvent = model<ICalendarEvent>("CalendarEvent", calendarEventSchema);
