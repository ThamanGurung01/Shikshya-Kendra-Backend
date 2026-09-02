import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { StudentFeeConfigSchema } from "../validators/student-fee-config.validator";
import { zodError } from "../utils/zod-error.util";
import * as studentFeeConfigService from "../services/student-fee-config.service";
import { Types } from "mongoose";

export const saveStudentFeeConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = StudentFeeConfigSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const config = await studentFeeConfigService.upsertStudentFeeConfig(
      schoolId,
      {
        ...parsed.data,
        customMonthlyFee: parsed.data.customMonthlyFee ?? null,
      }
    );

    return sendSuccess(res, "Student fee configuration saved successfully", config, 201);
  } catch (error) {
    console.error("Save student fee config error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getStudentFeeConfigs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const classId = req.params.classId as string | undefined;
    let configs;
    if (classId && Types.ObjectId.isValid(classId)) {
      configs = await studentFeeConfigService.getStudentFeeConfigsByClass(classId, schoolId);
    } else {
      configs = await studentFeeConfigService.getAllStudentFeeConfigs(schoolId);
    }

    return sendSuccess(res, "Student fee configs retrieved successfully", configs);
  } catch (error) {
    console.error("Get student fee configs error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getStudentFeeConfigByStudent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const studentId = req.params.studentId as string | undefined;
    if (!studentId || !Types.ObjectId.isValid(studentId)) {
      return sendError(res, "Invalid student ID format", undefined, 400);
    }

    const config = await studentFeeConfigService.getStudentFeeConfig(studentId, schoolId);
    return sendSuccess(res, "Student fee config retrieved successfully", config || null);
  } catch (error) {
    console.error("Get student fee config by student error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};
