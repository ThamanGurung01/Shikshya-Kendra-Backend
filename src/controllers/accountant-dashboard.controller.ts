import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { resolveSchoolId } from "../utils/resolve-school-id.util";
import { sendError, sendSuccess } from "../utils/response.util";
import * as dashboardService from "../services/accountant-dashboard.service";

export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const metrics = await dashboardService.getDashboardMetrics(schoolId, startDate, endDate);
    return sendSuccess(res, "Dashboard metrics retrieved successfully", metrics);
  } catch (error) {
    console.error("Get dashboard metrics error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getDashboardCharts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const charts = await dashboardService.getDashboardCharts(schoolId, startDate, endDate);
    return sendSuccess(res, "Dashboard charts retrieved successfully", charts);
  } catch (error) {
    console.error("Get dashboard charts error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getFinancialStatementReport = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const report = await dashboardService.getFinancialStatementReport(
      schoolId,
      startDate,
      endDate
    );

    return sendSuccess(res, "Financial statement report generated successfully", report);
  } catch (error) {
    console.error("Get financial statement error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

export const getFinancialForecast = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, "School ID is required", undefined, 400);

    const historyMonths  = Math.min(24, Math.max(6, parseInt(req.query.historyMonths  as string) || 12));
    const forecastMonths = Math.min(6,  Math.max(1, parseInt(req.query.forecastMonths as string) || 3));

    const data = await dashboardService.getFinancialForecast(schoolId, historyMonths, forecastMonths);
    return sendSuccess(res, "Financial forecast generated successfully", data);
  } catch (error) {
    console.error("Get financial forecast error:", error);
    return sendError(res, "Internal server error", undefined, 500);
  }
};

