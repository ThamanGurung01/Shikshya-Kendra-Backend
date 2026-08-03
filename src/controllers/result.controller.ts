import { Response } from 'express';
import * as ResultService from '../services/result.service';
import * as GradeAssignmentService from '../services/grade-assignment.service';
import * as GradeHistoryService from '../services/grade-history.service';
import { zodError } from '../utils/zod-error.util';
import { CreateResultSchema, UpdateResultStatusSchema } from '../validators/result.validator';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';

export const createResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = CreateResultSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) return sendError(res, 'Validation failed', zodError(parsed.error), 400);

    const result = await ResultService.createResult(parsed.data, req.userId!);
    return sendSuccess(res, 'Result created and grade assignments auto-assigned successfully', result, 201);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getAllResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const results = await ResultService.getAllResults(schoolId);
    return sendSuccess(res, 'Results retrieved successfully', results);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getResultById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const result = await ResultService.getResultById(id, schoolId);
    if (!result) return sendError(res, 'Result not found', undefined, 404);

    return sendSuccess(res, 'Result retrieved successfully', result);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const updateResultStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = UpdateResultStatusSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 'Validation failed', zodError(parsed.error), 400);

    const updated = await ResultService.updateResultStatus(id, schoolId, parsed.data.status);
    return sendSuccess(res, 'Result status updated successfully', updated);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const deleteResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const deleted = await ResultService.deleteResult(id, schoolId);
    return sendSuccess(res, 'Result deleted successfully', deleted);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getResultGradeAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const assignments = await ResultService.getResultGradeAssignments(id, schoolId);
    return sendSuccess(res, 'Grade assignments retrieved successfully', assignments);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getResultHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const history = await GradeHistoryService.getResultHistory(id, schoolId);
    return sendSuccess(res, 'Result grade history retrieved successfully', history);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getStudentGradeHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId as string;
    const { resultId, examId } = req.query;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const filters: { resultId?: string; examId?: string } = {};
    if (typeof resultId === 'string') filters.resultId = resultId;
    if (typeof examId === 'string') filters.examId = examId;

    const history = await GradeHistoryService.getStudentHistory(studentId, schoolId, filters);
    return sendSuccess(res, 'Student grade history retrieved successfully', history);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const reopenGradeAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gaId = req.params.gaId as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const reopened = await GradeAssignmentService.reopenGradeAssignment(gaId, schoolId);
    return sendSuccess(res, 'Grade assignment reopened successfully', reopened);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const reassignGradeAssignmentTeacher = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const gaId = req.params.gaId as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const { teacherId } = req.body;
    if (!teacherId) return sendError(res, 'Teacher ID is required', undefined, 400);

    const updated = await GradeAssignmentService.reassignGradeAssignmentTeacher(gaId, teacherId, schoolId);
    return sendSuccess(res, 'Grade assignment teacher reassigned successfully', updated);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getMyResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const role = req.role;
    const userId = req.userId;
    const { studentId } = req.query;

    if (!role || !userId) return sendError(res, 'User information not found', undefined, 400);

    const results = await ResultService.getMyResults(
      schoolId as string,
      role!,
      userId!,
      studentId as string | undefined
    );
    return sendSuccess(res, 'Results retrieved successfully', results);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getMyResultDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const role = req.role;
    const userId = req.userId;
    const resultId = req.params.resultId;
    const { studentId } = req.query;

    if (!role || !userId) return sendError(res, 'User information not found', undefined, 400);
    if (!resultId) return sendError(res, 'Result ID is required', undefined, 400);

    const details = await ResultService.getMyResultDetails(
      resultId as string,
      schoolId as string,
      role!,
      userId!,
      studentId as string | undefined
    );
    return sendSuccess(res, 'Result details retrieved successfully', details);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

