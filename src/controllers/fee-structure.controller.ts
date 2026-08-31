import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { FeeStructureSchema } from "../validators/fee-structure.validator";
import { zodError } from "../utils/zod-error.util";
import * as feeStructureService from "../services/fee-structure.service";
import { Types } from "mongoose";

export const saveFeeStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = FeeStructureSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const structure = await feeStructureService.upsertFeeStructure(
      schoolId,
      req.userId!,
      parsed.data
    );

    return sendSuccess(res, "Fee structure saved successfully", structure, 201);
  } catch (error) {
    console.error("Save fee structure error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getFeeStructures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const academicYearId = req.query.academicYearId as string | undefined;
    const structures = await feeStructureService.getFeeStructures(schoolId, academicYearId);

    return sendSuccess(res, "Fee structures retrieved successfully", structures);
  } catch (error) {
    console.error("Get fee structures error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getFeeStructureById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const structure = await feeStructureService.getFeeStructureById(id, schoolId);
    if (!structure) return sendError(res, "Fee structure not found", undefined, 404);

    return sendSuccess(res, "Fee structure retrieved successfully", structure);
  } catch (error) {
    console.error("Get fee structure by ID error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const deleteFeeStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const structure = await feeStructureService.deleteFeeStructure(id, schoolId);
    if (!structure) return sendError(res, "Fee structure not found", undefined, 404);

    return sendSuccess(res, "Fee structure deleted successfully", structure);
  } catch (error) {
    console.error("Delete fee structure error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};
