import { Request, Response } from 'express';
import * as AcademicYearService from '../services/academic-year.service';
import { zodError } from '../utils/zod-error.util';
import { AcademicYearSchema, IAcademicYearInput } from '../validators/academic-year.validator';
import { Types } from 'mongoose';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';

// ─── Create AcademicYear ───────────────────────────────────────────────────────────
export const createAcademicYear = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const parsed = AcademicYearSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;
        const AcademicYear = await AcademicYearService.createAcademicYear(parsedData,{
          schoolId: req.schoolId,
        });

    return sendSuccess(
      res,
      'AcademicYear created successfully',
      {
         name: AcademicYear.name,
         startDate: AcademicYear.startDate,
         endDate: AcademicYear.endDate,
         isCurrent: AcademicYear.isCurrent,
      },
      201,
    );
  } catch (error) {
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Get All AcademicYears ─────────────────────────────────────────────────────────
export const getAllAcademicYears = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if(!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }
    const AcademicYears = await AcademicYearService.getAllAcademicYears(schoolId);
    if (AcademicYears.length === 0) return sendSuccess(res, 'AcademicYear not found', [], 200);
    sendSuccess(res, 'AcademicYears retrieved successfully', AcademicYears, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Get AcademicYear By ID ────────────────────────────────────────────────────────
export const getAcademicYearById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const schoolId = resolveSchoolId(req);
    if(!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }
    const AcademicYear = await AcademicYearService.getAcademicYearById(id);
    if (!AcademicYear) return sendSuccess(res, 'AcademicYear not found', {}, 200);
    if (AcademicYear.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    sendSuccess(res, 'AcademicYear retrieved successfully', AcademicYear, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Update AcademicYear ───────────────────────────────────────────────────────────
export const updateAcademicYear = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const schoolId = resolveSchoolId(req);
    if(!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }
    const currentAcademicYear = await AcademicYearService.getAcademicYearById(id);
    if (!currentAcademicYear) return sendError(res, 'AcademicYear not found', undefined, 404);
    if (currentAcademicYear.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }

    const parsed = AcademicYearSchema.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      console.error('Update validation failed:', JSON.stringify(tree, null, 2));
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;
    const AcademicYear = await AcademicYearService.updateAcademicYear(id, schoolId, parsedData);
    if (!AcademicYear) return sendError(res, 'AcademicYear not found', undefined, 404);
    sendSuccess(res, 'AcademicYear updated successfully', AcademicYear, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Hard Delete AcademicYear ──────────────────────────────────────────────────────
export const hardDeleteAcademicYear = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const schoolId = resolveSchoolId(req);
    if(!schoolId) return sendError(res, 'School ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(schoolId)) {
      return sendError(res, 'Invalid school ID format', undefined, 400);
    }
    const currentAcademicYear = await AcademicYearService.getAcademicYearById(id);
    if (!currentAcademicYear) return sendError(res, 'AcademicYear not found', undefined, 404);
    if (currentAcademicYear.schoolId.toString() !== schoolId) {
      return sendError(res, 'Forbidden', undefined, 403);
    }
    const AcademicYear = await AcademicYearService.hardDeleteAcademicYear(id, schoolId);
    if (!AcademicYear) return sendError(res, 'AcademicYear not found', undefined, 404);
    sendSuccess(res, 'AcademicYear permanently deleted successfully', AcademicYear, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};