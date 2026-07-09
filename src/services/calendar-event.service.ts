import { CalendarEvent } from "../models/calendar-event.model";
import { ICalendarEventInput } from "../validators/calendar-event.validator";
import { Types } from "mongoose";

export const createEvent = async (schoolId: string, createdBy: string, data: ICalendarEventInput) => {
  return await CalendarEvent.create({
    title: data.title,
    description: data.description,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    category: data.category,
    isHoliday: data.isHoliday,
    schoolId: new Types.ObjectId(schoolId),
    createdBy: new Types.ObjectId(createdBy),
  });
};

export const getEvents = async (schoolId: string, startDate?: string, endDate?: string) => {
  const filter: any = { schoolId: new Types.ObjectId(schoolId) };
  if (startDate && endDate) {
    filter.startDate = { $lte: new Date(endDate) };
    filter.endDate = { $gte: new Date(startDate) };
  }
  return await CalendarEvent.find(filter)
    .populate("createdBy", "name role")
    .sort({ startDate: 1 })
    .lean();
};

export const updateEvent = async (schoolId: string, eventId: string, data: any) => {
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.category !== undefined) updateData.category = data.category;
  if (data.isHoliday !== undefined) updateData.isHoliday = data.isHoliday;

  const event = await CalendarEvent.findOneAndUpdate(
    { _id: new Types.ObjectId(eventId), schoolId: new Types.ObjectId(schoolId) },
    updateData,
    { new: true, runValidators: true }
  ).lean();
  if (!event) throw new Error("Event not found");
  return event;
};

export const deleteEvent = async (schoolId: string, eventId: string) => {
  const event = await CalendarEvent.findOneAndDelete({
    _id: new Types.ObjectId(eventId),
    schoolId: new Types.ObjectId(schoolId),
  }).lean();
  if (!event) throw new Error("Event not found");
  return event;
};
