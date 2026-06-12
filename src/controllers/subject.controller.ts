import { Request, Response } from 'express';
import * as SubjectService from '../services/subject.service';
import { zodError } from '../utils/zod-error.util';
import { SubjectSchema } from '../validators/subject.validator';
import { Types } from 'mongoose';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';

export const createSubject = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    const parsed = SubjectSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const createdSubject = await SubjectService.createSubject(parsed.data);
    return sendSuccess(res, 'Subject created successfully', createdSubject, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getAllSubjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId= resolveSchoolId(req);
    if(!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }
    const subjects = await SubjectService.getAllSubjects(schoolId);
    if (subjects.length === 0) return sendSuccess(res, 'Subject not found', [], 200);
    return sendSuccess(res, 'Subjects retrieved successfully', subjects, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getSubjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const subject = await SubjectService.getSubjectById(id);
    if (!subject) return sendSuccess(res, 'Subject not found', {}, 200);
    const schoolId = resolveSchoolId(req);
    if(!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    if (subject.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    return sendSuccess(res, 'Subject retrieved successfully', subject, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const currentSubject = await SubjectService.getSubjectById(id);
    if (!currentSubject) return sendError(res, 'Subject not found', undefined, 404);

    const schoolId = req.schoolId;
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    if (currentSubject.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    const parsed = SubjectSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      console.error('Update validation failed:', JSON.stringify(tree, null, 2));
      return sendError(res, 'Validation failed', tree, 400);
    }

    const updatedSubject = await SubjectService.updateSubjectBySchool(id, schoolId, parsed.data);
    if (!updatedSubject) return sendError(res, 'Subject not found', undefined, 404);
    return sendSuccess(res, 'Subject updated successfully', updatedSubject, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const hardDeleteSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const currentSubject = await SubjectService.getSubjectById(id);
    if (!currentSubject) return sendError(res, 'Subject not found', undefined, 404);
    if (currentSubject.schoolId.toString() !== req.schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    const subject = await SubjectService.hardDeleteSubjectBySchool(id, req.schoolId);
    if (!subject) return sendError(res, 'Subject not found', undefined, 404);
    return sendSuccess(res, 'Subject permanently deleted successfully', subject, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};