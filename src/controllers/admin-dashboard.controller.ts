import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { sendError, sendSuccess } from '../utils/response.util';
import * as adminDashboardService from '../services/admin-dashboard.service';

export const getAdminDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School context missing or invalid', undefined, 400);
    }

    const stats = await adminDashboardService.getAdminDashboardStats(schoolId);
    return sendSuccess(res, 'Admin dashboard statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Error in getAdminDashboardStats:', error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};
