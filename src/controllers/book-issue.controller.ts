import { Response } from 'express';
import { Types } from 'mongoose';
import * as BookIssueService from '../services/book-issue.service';
import { zodError } from '../utils/zod-error.util';
import { BookIssueSchema } from '../validators/book-issue.validator';
import { sendError, sendSuccess } from '../utils/response.util';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const issueBook = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = BookIssueSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const createdIssue = await BookIssueService.issueBook(schoolId, parsed.data, req.userId);
    return sendSuccess(res, 'Book issued successfully', createdIssue, 201);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 400);
  }
};

export const returnBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'Issue ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const { returnDate, fine, notes } = req.body;
    const returnData: { returnDate?: Date; fine?: number; notes?: string } = {};
    if (returnDate) returnData.returnDate = new Date(returnDate);
    if (fine !== undefined) returnData.fine = Number(fine);
    if (notes) returnData.notes = notes;

    const returnedIssue = await BookIssueService.returnBook(schoolId, id, returnData);
    return sendSuccess(res, 'Book returned successfully', returnedIssue, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 400);
  }
};

export const getAllBookIssues = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const { status, studentId, teacherId, bookId } = req.query;
    const filter: { status?: string; studentId?: string; teacherId?: string; bookId?: string } = {};
    if (status) filter.status = status as string;
    if (studentId) filter.studentId = studentId as string;
    if (teacherId) filter.teacherId = teacherId as string;
    if (bookId) filter.bookId = bookId as string;

    const issues = await BookIssueService.getAllBookIssues(schoolId, filter);
    return sendSuccess(res, 'Book issues retrieved successfully', issues, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getLibrarianStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const stats = await BookIssueService.getLibrarianStats(schoolId);
    return sendSuccess(res, 'Librarian dashboard stats retrieved successfully', stats, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};
