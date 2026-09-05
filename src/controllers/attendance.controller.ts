import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  submitAttendanceService,
  getAttendanceService,
  getAssignedClassService,
  scanQrAttendanceService,
  getAttendanceAnalyticsService
} from "../services/attendance.service";
import { submitAttendanceSchema, scanQrAttendanceSchema, getAttendanceAnalyticsSchema } from "../validators/attendance.validator";
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

export const scanQrAttendance = async (
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

    const parseResult = scanQrAttendanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, "Validation failed", parseResult.error.issues.map((e: any) => e.message), 400);
    }

    const data = await scanQrAttendanceService(schoolId, userId, role, parseResult.data);
    return sendSuccess(res, data.message || "Attendance recorded successfully", data, 200);
  } catch (error: any) {
    console.error("Scan QR attendance error:", error);
    const status = error.statusCode || 500;
    return sendError(res, error.message || "Error processing QR attendance", error.message, status);
  }
};

export const getAttendanceAnalytics = async (
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

    const parseResult = getAttendanceAnalyticsSchema.safeParse(req.query);
    if (!parseResult.success) {
      return sendError(res, "Validation failed", parseResult.error.issues.map((e: any) => e.message), 400);
    }

    const { classId, sectionId, academicYearId, windowDays, threshold, riskFilter, isClassTeacherMode } = parseResult.data;

    const data = await getAttendanceAnalyticsService(
      schoolId,
      userId,
      role,
      classId,
      sectionId,
      academicYearId,
      windowDays,
      threshold,
      riskFilter,
      isClassTeacherMode
    );

    return sendSuccess(res, "Attendance sliding window analytics generated successfully", data, 200);
  } catch (error: any) {
    console.error("Get attendance analytics error:", error);
    const status = error.statusCode || 500;
    return sendError(res, error.message || "Error generating attendance analytics", error.message, status);
  }
};

