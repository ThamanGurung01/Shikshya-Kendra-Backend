import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import * as AnnouncementService from "../services/announcement.service";
import { AnnouncementSchema, UpdateAnnouncementSchema } from "../validators/announcement.validator";
import { zodError } from "../utils/zod-error.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { Types } from "mongoose";

export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    const parsed = AnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const parsedData = parsed.data;

    // Check teacher restrictions: Teachers can only post to students or parents
    if (req.role === "teacher") {
      const allowedAudiences = ["students", "parents"];
      if (!allowedAudiences.includes(parsedData.audience)) {
        return sendError(res, "Teachers can only broadcast to students and parents", undefined, 403);
      }
    }

    const announcement = await AnnouncementService.createAnnouncement(schoolId, req.userId, parsedData);
    return sendSuccess(res, "Announcement posted successfully", announcement, 201);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getAnnouncements = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId || !req.role) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    const { classId, sectionId, showOnLogin, createdByMe, page, limit } = req.query as any;

    const data = await AnnouncementService.getAnnouncements(schoolId, req.role, req.userId, {
      classId: classId as string | undefined,
      sectionId: sectionId as string | undefined,
      showOnLogin: showOnLogin !== undefined ? showOnLogin === "true" : undefined,
      createdByMe: createdByMe !== undefined ? createdByMe === "true" : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return sendSuccess(res, "Announcements retrieved successfully", data, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const updateAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId || !req.role) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const id = req.params.id as string;
    if (!id || !Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    const parsed = UpdateAnnouncementSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const parsedData = parsed.data;

    if (req.role === "teacher" && parsedData.audience) {
      const allowedAudiences = ["students", "parents"];
      if (!allowedAudiences.includes(parsedData.audience)) {
        return sendError(res, "Teachers can only broadcast to students and parents", undefined, 403);
      }
    }

    const data = await AnnouncementService.updateAnnouncement(schoolId, id, req.userId, req.role, parsedData);
    return sendSuccess(res, "Announcement updated successfully", data, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 400);
  }
};

export const deleteAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId || !req.role) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const id = req.params.id as string;
    if (!id || !Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    await AnnouncementService.deleteAnnouncement(schoolId, id, req.userId, req.role);
    return sendSuccess(res, "Announcement deleted successfully", undefined, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 400);
  }
};

export const markAnnouncementAsRead = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const id = req.params.id as string;
    if (!id || !Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    await AnnouncementService.markAnnouncementAsRead(schoolId, id, req.userId);
    return sendSuccess(res, "Announcement marked as read", undefined, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 400);
  }
};

export const markAllAnnouncementsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId || !req.role) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School context missing', undefined, 403);

    await AnnouncementService.markAllAnnouncementsAsRead(schoolId, req.role, req.userId);
    return sendSuccess(res, "All announcements marked as read", undefined, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};
