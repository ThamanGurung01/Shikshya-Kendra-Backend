import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { IncomeSchema } from "../validators/income.validator";
import { zodError } from "../utils/zod-error.util";
import * as incomeService from "../services/income.service";
import { Types } from "mongoose";

export const createIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = IncomeSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const income = await incomeService.createIncome(
      schoolId,
      req.userId!,
      parsed.data
    );

    return sendSuccess(res, "Income recorded successfully", income, 201);
  } catch (error) {
    console.error("Create income error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getIncomes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const filter = {
      category: req.query.category as string | undefined,
      paymentMethod: req.query.paymentMethod as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
    };

    const incomes = await incomeService.getIncomes(schoolId, filter);
    return sendSuccess(res, "Incomes retrieved successfully", incomes);
  } catch (error) {
    console.error("Get incomes error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getIncomeById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const income = await incomeService.getIncomeById(id, schoolId);
    if (!income) return sendError(res, "Income voucher not found", undefined, 404);

    return sendSuccess(res, "Income voucher retrieved successfully", income);
  } catch (error) {
    console.error("Get income by ID error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const updateIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const parsed = IncomeSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const updated = await incomeService.updateIncome(id, schoolId, parsed.data as any);
    if (!updated) return sendError(res, "Income voucher not found", undefined, 404);

    return sendSuccess(res, "Income voucher updated successfully", updated);
  } catch (error) {
    console.error("Update income error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const deleteIncome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const deleted = await incomeService.deleteIncome(id, schoolId);
    if (!deleted) return sendError(res, "Income voucher not found", undefined, 404);

    return sendSuccess(res, "Income voucher deleted successfully", deleted);
  } catch (error) {
    console.error("Delete income error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};
