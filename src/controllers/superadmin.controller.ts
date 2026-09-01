import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as superadminService from '../services/superadmin.service';
import { sendError, sendSuccess } from '../utils/response.util';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await superadminService.getSuperadminDashboardStats();
    return sendSuccess(res, 'Superadmin dashboard stats retrieved successfully', stats);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to fetch dashboard stats', undefined, 500);
  }
};

export const resetPrincipalPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return sendError(res, 'Both userId and newPassword are required', undefined, 400);
    }

    const updatedUser = await superadminService.resetPrincipalPassword(userId, newPassword);
    return sendSuccess(res, `Password reset successfully for ${updatedUser.name} (${updatedUser.email})`, updatedUser);
  } catch (error: any) {
    return sendError(res, error?.message || 'Failed to reset password', undefined, 400);
  }
};
