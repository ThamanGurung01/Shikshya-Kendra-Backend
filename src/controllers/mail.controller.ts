import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  sendMailService,
  getInboxService,
  getSentService,
  getMailByIdService,
  markAllAsReadService,
  deleteMailService,
  getRecipientMetaService,
  searchRecipientsService,
  getUnreadCount,
} from '../services/mail.service';
import { sendSuccess, sendError } from '../utils/response.util';

export const sendMail = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const senderId = req.userId;
    const role = req.role;
    const schoolId = req.schoolId;

    if (!senderId || !role || !schoolId) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    const result = await sendMailService(schoolId, senderId, role, req.body);
    return sendSuccess(res, 'Mail sent successfully', result, 201);
  } catch (error: any) {
    console.error('sendMail controller error:', error);
    return sendError(res, error.message || 'Failed to send mail', undefined, 400);
  }
};

export const getInbox = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;

    if (!userId || !schoolId) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await getInboxService(schoolId, userId, page, limit);
    return sendSuccess(res, 'Inbox retrieved successfully', result);
  } catch (error: any) {
    console.error('getInbox controller error:', error);
    return sendError(res, error.message || 'Failed to retrieve inbox', undefined, 500);
  }
};

export const getSent = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;

    if (!userId || !schoolId) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await getSentService(schoolId, userId, page, limit);
    return sendSuccess(res, 'Sent folder retrieved successfully', result);
  } catch (error: any) {
    console.error('getSent controller error:', error);
    return sendError(res, error.message || 'Failed to retrieve sent folder', undefined, 500);
  }
};

export const getMailById = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;
    const { id } = req.params;

    if (!userId || !schoolId || !id) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    const result = await getMailByIdService(schoolId, userId, id as string);
    return sendSuccess(res, 'Mail detail retrieved successfully', result);
  } catch (error: any) {
    console.error('getMailById controller error:', error);
    return sendError(res, error.message || 'Mail not found', undefined, 404);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;

    if (!userId || !schoolId) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    await markAllAsReadService(schoolId, userId);
    return sendSuccess(res, 'All mails marked as read', null);
  } catch (error: any) {
    console.error('markAllAsRead controller error:', error);
    return sendError(res, error.message || 'Failed to mark all as read', undefined, 500);
  }
};

export const deleteMail = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    const schoolId = req.schoolId;
    const { id } = req.params;

    if (!userId || !schoolId || !id) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    await deleteMailService(schoolId, userId, id as string);
    return sendSuccess(res, 'Mail deleted successfully', null);
  } catch (error: any) {
    console.error('deleteMail controller error:', error);
    return sendError(res, error.message || 'Failed to delete mail', undefined, 500);
  }
};

export const getRecipientMeta = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    const result = await getRecipientMetaService(schoolId);
    return sendSuccess(res, 'Metadata retrieved successfully', result);
  } catch (error: any) {
    console.error('getRecipientMeta controller error:', error);
    return sendError(res, error.message || 'Failed to retrieve metadata', undefined, 500);
  }
};

export const searchRecipients = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    const userRole = req.role;
    const schoolId = req.schoolId;
    const queryText = ((req.query.q as string) || '').trim();

    if (!userId || !userRole || !schoolId) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }

    const result = await searchRecipientsService(schoolId, queryText, userId, userRole);
    return sendSuccess(res, 'Recipients retrieved successfully', result);
  } catch (error: any) {
    console.error('searchRecipients controller error:', error);
    return sendError(res, error.message || 'Failed to search recipients', undefined, 500);
  }
};

export const getUnreadMailCount = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 'Unauthorized', undefined, 401);
    }
    const count = await getUnreadCount(userId);
    return sendSuccess(res, 'Unread count retrieved', { unreadCount: count });
  } catch (error: any) {
    console.error('getUnreadMailCount error:', error);
    return sendError(res, error.message || 'Failed to get unread mail count', undefined, 500);
  }
};
