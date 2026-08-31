import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import {
  StaffSalaryConfigSchema,
  BatchPayrollSchema,
  DisbursePayrollSchema,
} from "../validators/payroll.validator";
import { zodError } from "../utils/zod-error.util";
import * as payrollService from "../services/payroll.service";
import { Types } from "mongoose";

export const saveSalaryConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = StaffSalaryConfigSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const config = await payrollService.saveSalaryConfig(schoolId, parsed.data);
    return sendSuccess(res, "Staff salary configuration saved successfully", config, 201);
  } catch (error) {
    console.error("Save salary config error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getSalaryConfigs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const role = req.query.role as string | undefined;
    const configs = await payrollService.getSalaryConfigs(schoolId, role);

    return sendSuccess(res, "Salary configurations retrieved successfully", configs);
  } catch (error) {
    console.error("Get salary configs error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const deleteSalaryConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const deleted = await payrollService.deleteSalaryConfig(id, schoolId);
    if (!deleted) return sendError(res, "Salary configuration not found", undefined, 404);

    return sendSuccess(res, "Salary configuration deleted successfully", deleted);
  } catch (error) {
    console.error("Delete salary config error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const generateBatchPayroll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = BatchPayrollSchema.safeParse({
      month: Number(req.body.month),
      year: Number(req.body.year),
    });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const payrolls = await payrollService.generateBatchPayroll(
      schoolId,
      req.userId!,
      parsed.data.month,
      parsed.data.year
    );

    return sendSuccess(res, "Batch payroll generated successfully", payrolls, 201);
  } catch (error) {
    console.error("Generate batch payroll error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getPayrolls = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const filter = {
      month: req.query.month ? Number(req.query.month) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      staffRole: req.query.staffRole as string | undefined,
      paymentStatus: req.query.paymentStatus as string | undefined,
    };

    const payrolls = await payrollService.getPayrolls(schoolId, filter);
    return sendSuccess(res, "Payroll sheets retrieved successfully", payrolls);
  } catch (error) {
    console.error("Get payrolls error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const disburseSalary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const parsed = DisbursePayrollSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const disbursed = await payrollService.disburseSalary(
      id,
      schoolId,
      req.userId!,
      parsed.data
    );

    return sendSuccess(res, "Salary disbursed successfully", disbursed);
  } catch (error: any) {
    console.error("Disburse salary error:", error);
    return sendError(res, error.message || "Internal server error", undefined, 500);
  }
};
