import { z } from "zod";

export const CalendarEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date format"),
  category: z.enum(["holiday", "program", "sports_day", "exam", "other"]).default("other"),
  isHoliday: z.boolean().optional().default(false),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

export const UpdateCalendarEventSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date format").optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date format").optional(),
  category: z.enum(["holiday", "program", "sports_day", "exam", "other"]).optional(),
  isHoliday: z.boolean().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

export type ICalendarEventInput = z.infer<typeof CalendarEventSchema>;
export type IUpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventSchema>;
