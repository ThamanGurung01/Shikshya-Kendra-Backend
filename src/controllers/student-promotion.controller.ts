import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { zodError } from "../utils/zod-error.util";
import {
  BulkPromotionSchema,
  PromotionPreviewQuerySchema,
} from "../validators/student-promotion.validator";
import * as promotionService from "../services/student-promotion.service";

export const getPromotionPreview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) return sendError(res, "Unauthorized", undefined, 401);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School context missing", undefined, 403);

    const parsed = PromotionPreviewQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, "Validation failed", tree, 400);
    }

    const { sourceAcademicYearId, sourceClassId, sourceSectionId, targetAcademicYearId } = parsed.data;

    const data = await promotionService.getPromotionEligibility(
      schoolId,
      sourceAcademicYearId,
      sourceClassId,
      sourceSectionId,
      targetAcademicYearId,
    );

    return sendSuccess(res, "Promotion preview retrieved successfully", data);
  } catch (error: any) {
    console.error("Error in getPromotionPreview:", error);
    return sendError(res, error.message || "Internal Server Error", undefined, 500);
  }
};

export const executeBulkPromotion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) return sendError(res, "Unauthorized", undefined, 401);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School context missing", undefined, 403);

    const parsed = BulkPromotionSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, "Validation failed", tree, 400);
    }

    const result = await promotionService.executeBulkPromotion(schoolId, parsed.data);

    return sendSuccess(res, "Class upgrade / bulk promotion executed successfully", result, 200);
  } catch (error: any) {
    console.error("Error in executeBulkPromotion:", error);
    return sendError(res, error.message || "Internal Server Error", undefined, 500);
  }
};

export const getStudentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) return sendError(res, "Unauthorized", undefined, 401);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School context missing", undefined, 403);

    const studentIdParam = req.params.studentId;
    const studentId = Array.isArray(studentIdParam) ? studentIdParam[0] : studentIdParam;
    if (!studentId) return sendError(res, "studentId parameter is required", undefined, 400);

    const data = await promotionService.getStudentAcademicHistory(schoolId, studentId);
    if (!data) return sendError(res, "Student not found", undefined, 404);

    return sendSuccess(res, "Student academic history retrieved successfully", data);
  } catch (error: any) {
    console.error("Error in getStudentHistory:", error);
    return sendError(res, error.message || "Internal Server Error", undefined, 500);
  }
};
