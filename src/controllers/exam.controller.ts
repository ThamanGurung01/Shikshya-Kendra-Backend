import { Request, Response } from 'express';
import * as ExamService from '../services/exam.service';
import { zodError } from '../utils/zod-error.util';
import { ExamSchema, ExamRoutineSchema } from '../validators/exam.validator';
import { Types } from 'mongoose';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';

export const createExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) return sendError(res, 'Invalid school ID format', undefined, 400);

    const parsed = ExamSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const createdExam = await ExamService.createExam(parsed.data);
    return sendSuccess(res, 'Exam created and routines generated successfully', createdExam, 201);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getAllExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const exams = await ExamService.getAllExams(schoolId as string);
    return sendSuccess(res, 'Exams retrieved successfully', exams, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getExamById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const exam = await ExamService.getExamById(id as string, schoolId as string);
    if (!exam) return sendError(res, 'Exam not found', undefined, 404);

    return sendSuccess(res, 'Exam retrieved successfully', exam, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    // Only allow updating status or other partial fields, maybe re-generation is a different endpoint
    const updatedExam = await ExamService.updateExam(id as string, schoolId as string, req.body);
    if (!updatedExam) return sendError(res, 'Exam not found', undefined, 404);

    return sendSuccess(res, 'Exam updated successfully', updatedExam, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const deleteExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const deleted = await ExamService.deleteExam(id as string, schoolId as string);
    if (!deleted) return sendError(res, 'Exam not found', undefined, 404);

    return sendSuccess(res, 'Exam deleted successfully', deleted, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getExamRoutine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId, classId } = req.query;
    const schoolId = resolveSchoolId(req);
    
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!examId) return sendError(res, 'examId is required', undefined, 400);

    const routine = await ExamService.getExamRoutine(examId as string, classId as string | undefined, schoolId as string);
    return sendSuccess(res, 'Exam routine retrieved successfully', routine, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateExamRoutineCell = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const updated = await ExamService.updateExamRoutine(id as string, schoolId as string, req.body);
    if (!updated) return sendError(res, 'Exam routine not found', undefined, 404);

    return sendSuccess(res, 'Exam routine updated successfully', updated, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const createExamRoutineCell = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = ExamRoutineSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const created = await ExamService.createExamRoutineCell({ ...parsed.data, schoolId: schoolId as string });
    return sendSuccess(res, 'Exam routine cell created successfully', created, 201);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const deleteExamRoutineCell = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const deleted = await ExamService.deleteExamRoutineCell(id as string, schoolId as string);
    if (!deleted) return sendError(res, 'Exam routine cell not found', undefined, 404);

    return sendSuccess(res, 'Exam routine cell deleted successfully', deleted, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getMyExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.query;
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const role = req.role;
    const userId = req.userId;
    
    if (!role || !userId) return sendError(res, 'User information not found', undefined, 400);

    const exams = await ExamService.getMyExams(schoolId as string, role, userId, studentId as string | undefined);
    return sendSuccess(res, 'Exams retrieved successfully', exams, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const getMyExamRoutine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId, studentId } = req.query;
    const schoolId = resolveSchoolId(req);
    
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!examId) return sendError(res, 'examId is required', undefined, 400);

    const role = req.role;
    const userId = req.userId;

    if (!role || !userId) return sendError(res, 'User information not found', undefined, 400);

    const data = await ExamService.getMyExamRoutine(examId as string, schoolId as string, role, userId, studentId as string | undefined);
    return sendSuccess(res, 'Exam routine retrieved successfully', data, 200);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};
