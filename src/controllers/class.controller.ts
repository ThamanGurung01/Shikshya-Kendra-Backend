import { Request, Response } from 'express';
import * as ClassService from '../services/class.service';
import { zodError } from '../utils/zod-error.util';
import { ClassSchema } from '../validators/class.validator';
import { Types } from 'mongoose';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';

export const createClass = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    const parsed = ClassSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const createdClass = await ClassService.createClass(parsed.data);
    return sendSuccess(res, 'Class created successfully', createdClass, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getAllClasses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if(!schoolId) return sendError(res,'School ID is required',undefined,400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }
    const classes = await ClassService.getAllClasses(schoolId);
    if (classes.length === 0) return sendSuccess(res, 'Class not found', [], 200);
    return sendSuccess(res, 'Classes retrieved successfully', classes, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const classItem = await ClassService.getClassById(id);
    if (!classItem) return sendSuccess(res, 'Class not found', {}, 200);

    const schoolId = resolveSchoolId(req);
    if(!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    if (classItem.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    return sendSuccess(res, 'Class retrieved successfully', classItem, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const currentClass = await ClassService.getClassById(id);
    if (!currentClass) return sendError(res, 'Class not found', undefined, 404);

    const schoolId = req.schoolId;
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    if (currentClass.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    const parsed = ClassSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      console.error('Update validation failed:', JSON.stringify(tree, null, 2));
      return sendError(res, 'Validation failed', tree, 400);
    }

    const updatedClass = await ClassService.updateClassBySchool(id, schoolId, parsed.data);
    if (!updatedClass) return sendError(res, 'Class not found', undefined, 404);
    return sendSuccess(res, 'Class updated successfully', updatedClass, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const hardDeleteClass = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const currentClass = await ClassService.getClassById(id);
    if (!currentClass) return sendError(res, 'Class not found', undefined, 404);
    if (currentClass.schoolId.toString() !== req.schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    const classItem = await ClassService.hardDeleteClassBySchool(id, req.schoolId);
    if (!classItem) return sendError(res, 'Class not found', undefined, 404);
    return sendSuccess(res, 'Class permanently deleted successfully', classItem, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};