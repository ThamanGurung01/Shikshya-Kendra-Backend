import { Response } from 'express';
import * as WlmService from '../services/wlm.service';
import * as ResultService from '../services/result.service';
import { ResultModel } from '../models/result.model';
import { ExamModel } from '../models/exam.model';
import { GradeAssignment } from '../models/grade-assignment.model';
import { zodError } from '../utils/zod-error.util';
import { UpdateWlmConfigSchema } from '../validators/wlm.validator';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { IWlmBreakdown } from '../services/wlm.service';

// --- WLM Config ---

export const getWlmConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const config = await WlmService.getWlmConfig(schoolId);
    return sendSuccess(res, 'WLM config retrieved successfully', config);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const updateWlmConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = UpdateWlmConfigSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 'Validation failed', zodError(parsed.error), 400);

    const config = await WlmService.updateWlmConfig(schoolId, parsed.data);
    return sendSuccess(res, 'WLM config updated successfully', config);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

// --- WLM Scores ---

export const getWlmScores = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const resultId = req.params.id as string;
    const result = await ResultModel.findOne({ _id: resultId, schoolId, status: 'published' })
      .populate('wlmScores.studentId', 'studentName admissionNumber')
      .populate('wlmScores.classId', 'name')
      .populate('wlmScores.sectionId', 'name')
      .lean();
    if (!result) return sendError(res, 'Published result not found', undefined, 404);

    return sendSuccess(res, 'WLM scores retrieved successfully', result.wlmScores || []);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};

export const recalculateWlm = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const resultId = req.params.id as string;
    const result = await ResultModel.findOne({ _id: resultId, schoolId, status: 'published' }).lean();
    if (!result) return sendError(res, 'Published result not found', undefined, 404);

    // Re-run WLM calculation for all class+section combos
    const exam = await ExamModel.findById(result.examId).lean();
    if (!exam) return sendError(res, 'Exam not found', undefined, 404);

    const allWlmScores: IWlmBreakdown[] = [];
    for (const classId of result.classIds) {
      const sectionIds = await GradeAssignment.distinct('sectionId', { resultId, classId });
      for (const sectionId of sectionIds) {
        const scores = await WlmService.calculateWlmScores(
          resultId, schoolId, String(result.academicYearId),
          String(classId), String(sectionId), exam.endDate,
        );
        allWlmScores.push(...scores);
      }
    }

    const updated = await ResultModel.findOneAndUpdate(
      { _id: resultId, schoolId },
      { wlmScores: allWlmScores },
      { returnDocument: 'after' },
    )
      .populate('examId', 'name startDate endDate status')
      .populate('classIds', 'name')
      .populate('wlmScores.studentId', 'studentName admissionNumber')
      .populate('wlmScores.classId', 'name')
      .populate('wlmScores.sectionId', 'name')
      .lean();

    return sendSuccess(res, 'WLM scores recalculated successfully', updated?.wlmScores || []);
  } catch (error: any) {
    console.error(error);
    return sendError(res, error.message || 'Internal Server Error', undefined, 500);
  }
};
