import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import * as CalendarEventService from "../services/calendar-event.service";
import { CalendarEventSchema, UpdateCalendarEventSchema } from "../validators/calendar-event.validator";
import { zodError } from "../utils/zod-error.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { Types } from "mongoose";

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    const parsed = CalendarEventSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const parsedData = parsed.data;
    const event = await CalendarEventService.createEvent(schoolId, req.userId, parsedData as any);
    return sendSuccess(res, "Event created successfully", event, 201);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const events = await CalendarEventService.getEvents(schoolId, startDate, endDate);
    return sendSuccess(res, "Events retrieved successfully", events, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const id = req.params.id as string;
    if (!id || !Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    const parsed = UpdateCalendarEventSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const parsedData = parsed.data;
    const event = await CalendarEventService.updateEvent(schoolId, id, parsedData);
    return sendSuccess(res, "Event updated successfully", event, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 400);
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!id || !Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    await CalendarEventService.deleteEvent(schoolId, id);
    return sendSuccess(res, "Event deleted successfully", undefined, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 400);
  }
};
