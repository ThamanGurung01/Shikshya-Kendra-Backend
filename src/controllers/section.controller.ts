import { Request, Response } from 'express';
import * as SectionService from '../services/section.service';
import { zodError, SectionSchema } from '../validators/section.validator';
import { Types } from 'mongoose';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const resolveSchoolId = (req: AuthenticatedRequest) => {
  if (req.role === 'superadmin') return req.body.schoolId;
  return req.schoolId;
};

export const createSection = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    const parsed = SectionSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }

    const createdSection = await SectionService.createSection(parsed.data);
    return sendSuccess(res, 'Section created successfully', createdSection, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getAllSections = async (_: Request, res: Response) => {
  try {
    const sections = await SectionService.getAllSections();
    if (sections.length === 0) return sendSuccess(res, 'Section not found', [], 200);
    return sendSuccess(res, 'Sections retrieved successfully', sections, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getSectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const section = await SectionService.getSectionById(id);
    if (!section) return sendSuccess(res, 'Section not found', {}, 200);
    return sendSuccess(res, 'Section retrieved successfully', section, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const currentSection = await SectionService.getSectionById(id);
    if (!currentSection) return sendError(res, 'Section not found', undefined, 404);

    const schoolId = req.role === 'superadmin'
      ? req.body.schoolId ?? currentSection.schoolId.toString()
      : req.schoolId ?? currentSection.schoolId.toString();
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }

    const parsed = SectionSchema.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      console.error('Update validation failed:', JSON.stringify(tree, null, 2));
      return sendError(res, 'Validation failed', tree, 400);
    }

    const updatedSection = await SectionService.updateSection(id, parsed.data);
    if (!updatedSection) return sendError(res, 'Section not found', undefined, 404);
    return sendSuccess(res, 'Section updated successfully', updatedSection, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const hardDeleteSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const section = await SectionService.hardDeleteSection(id);
    if (!section) return sendError(res, 'Section not found', undefined, 404);
    return sendSuccess(res, 'Section permanently deleted successfully', section, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};