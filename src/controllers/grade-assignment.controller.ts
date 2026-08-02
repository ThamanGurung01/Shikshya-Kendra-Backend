import { Response } from 'express';
import * as GradeAssignmentService from '../services/grade-assignment.service';
import * as GradeHistoryService from '../services/grade-history.service';
import { zodError } from '../utils/zod-error.util';
import { UpdateGradeEntriesSchema } from '../validators/grade-assignment.validator';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';

export const getMyGradeAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const assignments = await GradeAssignmentService.getMyGradeAssignments(req.userId!, schoolId);
    return sendSuccess(res, 'Grade assignments retrieved successfully', assignments);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getGradeAssignmentDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const role = req.role;
    let assignment;
    if (role === 'teacher') {
      assignment = await GradeAssignmentService.getMyGradeAssignmentDetail(id, req.userId!, schoolId);
    } else {
      assignment = await GradeAssignmentService.getAdminGradeAssignmentDetail(id, schoolId);
    }

    return sendSuccess(res, 'Grade assignment retrieved successfully', assignment);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const updateGradeEntries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = UpdateGradeEntriesSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 'Validation failed', zodError(parsed.error), 400);

    const updated = await GradeAssignmentService.updateGradeEntries(id, req.userId!, schoolId, parsed.data);
    return sendSuccess(res, 'Grade entries saved as draft successfully', updated);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const finalizeGradeAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const finalized = await GradeAssignmentService.finalizeGradeAssignment(id, req.userId!, schoolId);
    return sendSuccess(res, 'Grade assignment finalized successfully. History records written.', finalized);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const reopenGradeAssignment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const reopened = await GradeAssignmentService.reopenGradeAssignment(id, schoolId);
    return sendSuccess(res, 'Grade assignment reopened. Teacher can now re-enter marks.', reopened);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getAssignmentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const history = await GradeAssignmentService.getAssignmentHistory(id, schoolId);
    return sendSuccess(res, 'Grade assignment history retrieved successfully', history);
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
