import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { FeeHeadSchema } from "../validators/fee-head.validator";
import { zodError } from "../utils/zod-error.util";
import * as feeHeadService from "../services/fee-head.service";
import { Types } from "mongoose";

export const createFeeHead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = FeeHeadSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const feeHead = await feeHeadService.createFeeHead(schoolId, parsed.data);
    return sendSuccess(res, "Fee head created successfully", feeHead, 201);
  } catch (error) {
    console.error("Create fee head error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getFeeHeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const classId = req.query.classId as string | undefined;
    const feeHeads = await feeHeadService.getFeeHeads(schoolId, classId);

    return sendSuccess(res, "Fee heads retrieved successfully", feeHeads);
  } catch (error) {
    console.error("Get fee heads error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getFeeHeadById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const feeHead = await feeHeadService.getFeeHeadById(id, schoolId);
    if (!feeHead) return sendError(res, "Fee head not found", undefined, 404);

    return sendSuccess(res, "Fee head retrieved successfully", feeHead);
  } catch (error) {
    console.error("Get fee head by ID error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const updateFeeHead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const parsed = FeeHeadSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const updated = await feeHeadService.updateFeeHead(id, schoolId, parsed.data as any);
    if (!updated) return sendError(res, "Fee head not found", undefined, 404);

    return sendSuccess(res, "Fee head updated successfully", updated);
  } catch (error) {
    console.error("Update fee head error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const deleteFeeHead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const deleted = await feeHeadService.deleteFeeHead(id, schoolId);
    if (!deleted) return sendError(res, "Fee head not found", undefined, 404);

    return sendSuccess(res, "Fee head deleted successfully", deleted);
  } catch (error) {
    console.error("Delete fee head error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};
