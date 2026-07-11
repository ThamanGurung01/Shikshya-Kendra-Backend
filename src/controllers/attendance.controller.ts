import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  submitAttendanceService,
  getAttendanceService,
  getAssignedClassService
} from "../services/attendance.service";
import { submitAttendanceSchema } from "../validators/attendance.validator";
import { sendSuccess, sendError } from "../utils/response.util";

export const submitAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const schoolId = req.schoolId;
    const userId = req.userId;
    const role = req.role;
    if (!schoolId || !userId || !role) {
      return sendError(res, "User session details not found", undefined, 400);
    }

    // Validate request body
    const parseResult = submitAttendanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "Validation failed", parseResult.error.issues.map((e: any) => e.message), 400);
    }

    const data = await submitAttendanceService(schoolId, userId, role, parseResult.data);
    return sendSuccess(res, "Attendance records submitted successfully", data, 200);
  } catch (error: any) {
    console.error("Submit attendance error:", error);
    const status = error.statusCode || 500;
    return sendError(res, error.message || "Error submitting attendance records", error.message, status);
  }
};

export const getAttendance = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const schoolId = req.schoolId;
    const userId = req.userId;
    const role = req.role;
    if (!schoolId || !userId || !role) {
      return sendError(res, "User session details not found", undefined, 400);
    }

    const { classId, sectionId, date, academicYearId } = req.query as {
      classId: string;
      sectionId: string;
      date: string;
      academicYearId?: string;
    };

    if (!classId || !sectionId || !date) {
      return sendError(res, "classId, sectionId and date are required", undefined, 400);
    }

    const data = await getAttendanceService(
      schoolId,
      userId,
      role,
      classId,
      sectionId,
      date,
      academicYearId
    );

    return sendSuccess(res, "Attendance records fetched successfully", data, 200);
  } catch (error: any) {
    console.error("Get attendance error:", error);
    const status = error.statusCode || 500;
    return sendError(res, error.message || "Error fetching attendance records", error.message, status);
  }
};

export const getAssignedClass = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const schoolId = req.schoolId;
    const userId = req.userId;
    const role = req.role;
    if (!schoolId || !userId || !role) {
      return sendError(res, "User session details not found", undefined, 400);
    }

    const data = await getAssignedClassService(schoolId, userId, role);
    return sendSuccess(res, "Assigned class fetched successfully", data, 200);
  } catch (error: any) {
    console.error("Get assigned class error:", error);
    const status = error.statusCode || 500;
    return sendError(res, error.message || "Error fetching assigned class", error.message, status);
  }
};
