import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { zodError } from '../utils/zod-error.util';
import {
  bulkRoomSchema,
  classTeacherAssignmentSchema,
  generateRoutineSchema,
  routineCellUpdateSchema,
  routineSwapSchema,
  schoolScheduleConfigSchema,
  subjectTeacherMappingSchema,
} from '../validators/routine.validator';
import {
  deleteClassTeacherAssignmentService,
  deleteRoutineService,
  deleteSubjectTeacherMappingService,
  generateRoutineService,
  getRoutineService,
  getScheduleConfigService,
  listClassTeacherAssignmentsService,
  listSubjectTeacherMappingsService,
  saveClassTeacherAssignmentService,
  saveScheduleConfigService,
  saveSubjectTeacherMappingService,
  swapRoutineCellsService,
  updateBulkRoomService,
  updateRoutineCellService,
} from '../services/routine.service';

const getSchoolId = (req: AuthenticatedRequest) => resolveSchoolId(req);
const singleString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

export const saveScheduleConfig = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const parsed = schoolScheduleConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', zodError(parsed.error), 400);
    }

    const data = await saveScheduleConfigService(schoolId, parsed.data);
    return sendSuccess(res, 'Schedule template configuration saved successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error saving schedule config', undefined, error.statusCode || 500);
  }
};

export const getScheduleConfig = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const data = await getScheduleConfigService(schoolId);
    return sendSuccess(res, 'Schedule template config fetched successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error fetching schedule config', undefined, error.statusCode || 500);
  }
};

export const saveSubjectTeacherMapping = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const parsed = subjectTeacherMappingSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', zodError(parsed.error), 400);
    }

    const data = await saveSubjectTeacherMappingService(schoolId, parsed.data);
    return sendSuccess(res, 'Subject-teacher mapping saved successfully', data, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Error saving subject-teacher mapping', undefined, error.statusCode || 500);
  }
};

export const listSubjectTeacherMappings = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const classId = singleString(req.query.classId);
    const sectionId = singleString(req.query.sectionId);
    const filters: { classId?: string; sectionId?: string } = {};
    if (classId) {
      filters.classId = classId;
    }
    if (sectionId) {
      filters.sectionId = sectionId;
    }

    const data = await listSubjectTeacherMappingsService(schoolId, filters);
    return sendSuccess(res, 'Subject-teacher mappings fetched successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error fetching subject-teacher mappings', undefined, error.statusCode || 500);
  }
};

export const deleteSubjectTeacherMapping = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const id = singleString(req.params.id);
    if (!id) {
      return sendError(res, 'Mapping ID is required', undefined, 400);
    }

    const data = await deleteSubjectTeacherMappingService(schoolId, id);
    return sendSuccess(res, 'Subject-teacher mapping removed successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error removing subject-teacher mapping', undefined, error.statusCode || 500);
  }
};

export const saveClassTeacherAssignment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const parsed = classTeacherAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', zodError(parsed.error), 400);
    }

    const data = await saveClassTeacherAssignmentService(schoolId, parsed.data);
    return sendSuccess(res, 'Class teacher assigned successfully', data, 201);
  } catch (error: any) {
    return sendError(res, error.message || 'Error assigning class teacher', undefined, error.statusCode || 500);
  }
};

export const listClassTeacherAssignments = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const data = await listClassTeacherAssignmentsService(schoolId);
    return sendSuccess(res, 'Class teacher assignments fetched successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error fetching class teacher assignments', undefined, error.statusCode || 500);
  }
};

export const deleteClassTeacherAssignment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const id = singleString(req.params.id);
    if (!id) {
      return sendError(res, 'Assignment ID is required', undefined, 400);
    }

    const data = await deleteClassTeacherAssignmentService(schoolId, id);
    return sendSuccess(res, 'Class teacher assignment removed successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error removing class teacher assignment', undefined, error.statusCode || 500);
  }
};

export const getRoutine = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const classId = singleString(req.query.classId);
    const sectionId = singleString(req.query.sectionId);
    if (!classId || !sectionId) {
      return sendError(res, 'classId and sectionId are required', undefined, 400);
    }

    const data = await getRoutineService(schoolId, classId, sectionId);
    return sendSuccess(res, 'Class routine fetched successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error fetching class routine', undefined, error.statusCode || 500);
  }
};

export const updateRoutineCell = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const id = singleString(req.params.id);
    if (!id) {
      return sendError(res, 'Routine slot ID is required', undefined, 400);
    }

    const parsed = routineCellUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', zodError(parsed.error), 400);
    }

    const data = await updateRoutineCellService(schoolId, id, parsed.data);
    return sendSuccess(res, 'Timetable slot updated successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error updating routine cell', undefined, error.statusCode || 500);
  }
};

export const swapRoutineCells = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const parsed = routineSwapSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', zodError(parsed.error), 400);
    }

    const data = await swapRoutineCellsService(schoolId, parsed.data.idA, parsed.data.idB);
    return sendSuccess(res, 'Timetable slots swapped successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error swapping routine cells', undefined, error.statusCode || 500);
  }
};

export const autoGenerateRoutine = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const parsed = generateRoutineSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', zodError(parsed.error), 400);
    }

    const data = await generateRoutineService(schoolId, parsed.data);
    return sendSuccess(res, 'Class routine auto-generated successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error auto-generating class routine', undefined, error.statusCode || 500);
  }
};

export const updateBulkRoom = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    const parsed = bulkRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', zodError(parsed.error), 400);
    }

    const data = await updateBulkRoomService(
      schoolId,
      parsed.data.classId,
      parsed.data.sectionId,
      parsed.data.roomNumber,
    );
    return sendSuccess(res, 'Room number updated for all slots successfully', data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error updating classroom in bulk', undefined, error.statusCode || 500);
  }
};

export const deleteRoutine = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      return sendError(res, 'School ID is required', undefined, 400);
    }

    // Get sectionIds from query params (comma-separated) or body
    const sectionIdsQuery = singleString(req.query.sectionIds);
    let sectionIds: string[] | undefined;

    if (sectionIdsQuery) {
      sectionIds = sectionIdsQuery.split(',').map((id) => id.trim()).filter((id) => id.length > 0);
    } else if (req.body?.sectionIds && Array.isArray(req.body.sectionIds)) {
      sectionIds = req.body.sectionIds;
    }

    const data = await deleteRoutineService(schoolId, sectionIds);
    return sendSuccess(res, data.message, data, 200);
  } catch (error: any) {
    return sendError(res, error.message || 'Error deleting routine', undefined, error.statusCode || 500);
  }
};
