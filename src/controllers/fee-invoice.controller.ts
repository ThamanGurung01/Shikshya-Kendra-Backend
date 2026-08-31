import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { CollectFeePaymentSchema } from "../validators/fee-invoice.validator";
import { zodError } from "../utils/zod-error.util";
import * as feeInvoiceService from "../services/fee-invoice.service";
import { Types } from "mongoose";

export const getClassStudentsFeeSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const { academicYearId, classId, sectionId } = req.query as {
      academicYearId?: string;
      classId?: string;
      sectionId?: string;
    };

    const summary = await feeInvoiceService.getClassStudentsFeeSummary(
      schoolId,
      academicYearId,
      classId,
      sectionId
    );

    return sendSuccess(res, "Student fee summary retrieved successfully", summary);
  } catch (error) {
    console.error("Get class students fee summary error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getStudentDueSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const studentId = req.params.studentId as string | undefined;
    if (!studentId || !Types.ObjectId.isValid(studentId)) {
      return sendError(res, "Invalid student ID format", undefined, 400);
    }

    const { academicYearId } = req.query as { academicYearId?: string };
    const dueSummary = await feeInvoiceService.getStudentDueSummary(
      schoolId,
      studentId,
      academicYearId
    );

    return sendSuccess(res, "Student dues summary retrieved successfully", dueSummary);
  } catch (error: any) {
    console.error("Get student due summary error:", error);
    return sendError(res, error.message || "Internal server error", undefined, 500);
  }
};

export const getStudentFeeDetailsAndHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const studentId = req.params.studentId as string | undefined;
    if (!studentId || !Types.ObjectId.isValid(studentId)) {
      return sendError(res, "Invalid student ID format", undefined, 400);
    }

    const { academicYearId } = req.query as { academicYearId?: string };
    const details = await feeInvoiceService.getStudentFeeDetailsAndHistory(
      schoolId,
      studentId,
      academicYearId
    );

    return sendSuccess(res, "Student fee details retrieved successfully", details);
  } catch (error: any) {
    console.error("Get student fee details error:", error);
    return sendError(res, error.message || "Internal server error", undefined, 500);
  }
};

export const collectFeePayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const parsed = CollectFeePaymentSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const invoice = await feeInvoiceService.collectFeePayment(
      schoolId,
      req.userId!,
      parsed.data
    );

    return sendSuccess(res, "Payment collected and receipt generated successfully", invoice, 201);
  } catch (error) {
    console.error("Collect fee payment error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const filter = {
      search: req.query.search as string | undefined,
      classId: req.query.classId as string | undefined,
      paymentMethod: req.query.paymentMethod as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };

    const invoices = await feeInvoiceService.getInvoices(schoolId, filter);
    return sendSuccess(res, "Fee receipts retrieved successfully", invoices);
  } catch (error) {
    console.error("Get invoices error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getInvoiceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const id = req.params.id as string | undefined;
    if (!id || !Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);

    const invoice = await feeInvoiceService.getInvoiceById(id, schoolId);
    if (!invoice) return sendError(res, "Fee receipt not found", undefined, 404);

    return sendSuccess(res, "Fee receipt retrieved successfully", invoice);
  } catch (error) {
    console.error("Get invoice by ID error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getMyInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const invoices = await feeInvoiceService.getMyInvoices(
      schoolId,
      req.userId!,
      req.role || "student"
    );

    return sendSuccess(res, "My fee receipts retrieved successfully", invoices);
  } catch (error) {
    console.error("Get my invoices error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getMyDueSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const studentId = req.query.studentId as string | undefined;
    const summary = await feeInvoiceService.getMyDueSummary(
      schoolId,
      req.userId!,
      req.role || "student",
      studentId
    );

    return sendSuccess(res, "My fee due summary retrieved successfully", summary);
  } catch (error) {
    console.error("Get my due summary error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

