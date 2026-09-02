import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { ExpenseSchema } from "../validators/expense.validator";
import { zodError } from "../utils/zod-error.util";
import * as expenseService from "../services/expense.service";
import { Types } from "mongoose";

export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = ExpenseSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const expense = await expenseService.createExpense(
      schoolId,
      req.userId!,
      parsed.data
    );

    return sendSuccess(res, "Expense recorded successfully", expense, 201);
  } catch (error) {
    console.error("Create expense error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
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

    const expenses = await expenseService.getExpenses(schoolId, filter);
    return sendSuccess(res, "Expenses retrieved successfully", expenses);
  } catch (error) {
    console.error("Get expenses error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getExpenseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const expense = await expenseService.getExpenseById(id, schoolId);
    if (!expense) return sendError(res, "Expense voucher not found", undefined, 404);

    return sendSuccess(res, "Expense voucher retrieved successfully", expense);
  } catch (error) {
    console.error("Get expense by ID error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const updateExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const parsed = ExpenseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const updated = await expenseService.updateExpense(id, schoolId, parsed.data as any);
    if (!updated) return sendError(res, "Expense voucher not found", undefined, 404);

    return sendSuccess(res, "Expense voucher updated successfully", updated);
  } catch (error) {
    console.error("Update expense error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const deleted = await expenseService.deleteExpense(id, schoolId);
    if (!deleted) return sendError(res, "Expense voucher not found", undefined, 404);

    return sendSuccess(res, "Expense voucher deleted successfully", deleted);
  } catch (error) {
    console.error("Delete expense error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};
