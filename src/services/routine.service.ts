import mongoose from 'mongoose';
import { ClassModel } from '../models/class.model';
import { ClassRoutine } from '../models/class-routine.model';
import { ClassTeacherAssignment } from '../models/class-teacher-assignment.model';
import { SchoolScheduleConfig, type IPeriodConfig } from '../models/school-schedule-config.model';
import { SectionModel } from '../models/section.model';
import { SubjectModel } from '../models/subject.model';
import { SubjectTeacherMapping } from '../models/subject-teacher-mapping.model';
import { Teacher } from '../models/teacher.model';
import type {
  IClassTeacherAssignmentInput,
  IGenerateRoutineInput,
  IRoutineCellUpdateInput,
  ISchoolScheduleConfigInput,
  ISubjectTeacherMappingInput,
} from '../validators/routine.validator';

const routineDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

type RoutineDay = (typeof routineDays)[number];

const createHttpError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

const getTeacherName = (teacher: any) => teacher?.teacherName || teacher?.name || teacher?.fullName || 'Unknown Teacher';

const getEntityIdString = (entity: any): string | null => {
  if (!entity) {
    return null;
  }

  if (typeof entity === 'string') {
    return entity;
  }

  if (entity instanceof mongoose.Types.ObjectId) {
    return entity.toString();
  }

  if (entity._id instanceof mongoose.Types.ObjectId) {
    return entity._id.toString();
  }

  if (typeof entity._id === 'string') {
    return entity._id;
  }

  return null;
};

const getClassName = (classDoc: any) => classDoc?.name || 'Unknown Class';

const getSectionName = (sectionDoc: any) => sectionDoc?.name || 'Unknown Section';

const checkTeacherConflict = async (
  schoolId: string,
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  excludeRoutineId?: string,
) => {
  const conflictQuery: Record<string, unknown> = {
    schoolId,
    teacherId,
    dayOfWeek,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeRoutineId) {
    conflictQuery._id = { $ne: new mongoose.Types.ObjectId(excludeRoutineId) };
  }

  const conflict = await ClassRoutine.findOne(conflictQuery as any)
    .populate('classId', 'name')
    .populate('sectionId', 'name');

  if (conflict) {
    const className = getClassName(conflict.classId);
    const sectionName = getSectionName(conflict.sectionId);
    throw createHttpError(`Teacher is already assigned to class ${className} section ${sectionName} during this time`, 400);
  }
};

export const saveScheduleConfigService = async (schoolId: string, payload: ISchoolScheduleConfigInput) => {
  const cleanPayload = {
    workingDays: payload.workingDays,
    periods: payload.periods,
  };

  const config = await SchoolScheduleConfig.findOneAndUpdate(
    { schoolId },
    { $set: cleanPayload },
    { new: true, upsert: true, runValidators: true },
  );

  return config;
};

export const getScheduleConfigService = async (schoolId: string) => {
  const config = await SchoolScheduleConfig.findOne({ schoolId }).lean();
  if (!config) {
    throw createHttpError('Schedule configuration not found', 404);
  }
  return config;
};

export const saveSubjectTeacherMappingService = async (
  schoolId: string,
  payload: ISubjectTeacherMappingInput,
) => {
  const classDoc = await ClassModel.findOne({ _id: payload.classId, schoolId }).lean();
  if (!classDoc) {
    throw createHttpError('Class not found', 404);
  }

  const sectionDoc = await SectionModel.findOne({ _id: payload.sectionId, schoolId }).lean();
  if (!sectionDoc) {
    throw createHttpError('Section not found', 404);
  }

  const subjectDoc = await SubjectModel.findOne({ _id: payload.subjectId, schoolId }).lean();
  if (!subjectDoc) {
    throw createHttpError('Subject not found', 404);
  }

  if (subjectDoc.classId.toString() !== payload.classId) {
    throw createHttpError('Subject does not belong to the selected class', 400);
  }

  const teacherDoc = await Teacher.findOne({ _id: payload.teacherId, schoolId }).lean();
  if (!teacherDoc) {
    throw createHttpError('Teacher not found', 404);
  }

  const mapping = await SubjectTeacherMapping.findOneAndUpdate(
    {
      schoolId,
      classId: payload.classId,
      sectionId: payload.sectionId,
      subjectId: payload.subjectId,
    },
    {
      $set: {
        teacherId: payload.teacherId,
        periodsPerWeek: payload.periodsPerWeek,
      },
    },
    { new: true, upsert: true, runValidators: true },
  )
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'teacherName employeeId contact status');

  return mapping;
};

export const listSubjectTeacherMappingsService = async (
  schoolId: string,
  filters: { classId?: string; sectionId?: string } = {},
) => {
  const query: Record<string, unknown> = { schoolId };
  if (filters.classId) query.classId = filters.classId;
  if (filters.sectionId) query.sectionId = filters.sectionId;

  return await SubjectTeacherMapping.find(query)
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'teacherName employeeId contact status')
    .sort({ createdAt: -1 })
    .lean();
};

export const deleteSubjectTeacherMappingService = async (schoolId: string, id: string) => {
  const mapping = await SubjectTeacherMapping.findOneAndDelete({ _id: id, schoolId });
  if (!mapping) {
    throw createHttpError('Subject-teacher mapping not found', 404);
  }
  return mapping;
};

export const saveClassTeacherAssignmentService = async (
  schoolId: string,
  payload: IClassTeacherAssignmentInput,
) => {
  const classDoc = await ClassModel.findOne({ _id: payload.classId, schoolId }).lean();
  if (!classDoc) {
    throw createHttpError('Class not found', 404);
  }

  const sectionDoc = await SectionModel.findOne({ _id: payload.sectionId, schoolId }).lean();
  if (!sectionDoc) {
    throw createHttpError('Section not found', 404);
  }

  const teacherDoc = await Teacher.findOne({ _id: payload.teacherId, schoolId }).lean();
  if (!teacherDoc) {
    throw createHttpError('Teacher not found', 404);
  }

  const existingTeacherAssignment = await ClassTeacherAssignment.findOne({
    schoolId,
    teacherId: payload.teacherId,
    $or: [{ classId: { $ne: payload.classId } }, { sectionId: { $ne: payload.sectionId } }],
  })
    .populate('classId', 'name')
    .populate('sectionId', 'name');

  if (existingTeacherAssignment) {
    throw createHttpError(
      `Teacher is already assigned as a class teacher for ${getClassName(existingTeacherAssignment.classId)} section ${getSectionName(existingTeacherAssignment.sectionId)}`,
      400,
    );
  }

  const assignment = await ClassTeacherAssignment.findOneAndUpdate(
    { schoolId, classId: payload.classId, sectionId: payload.sectionId },
    { $set: { teacherId: payload.teacherId } },
    { new: true, upsert: true, runValidators: true },
  )
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('teacherId', 'teacherName employeeId contact status');

  return assignment;
};

export const listClassTeacherAssignmentsService = async (schoolId: string) => {
  return await ClassTeacherAssignment.find({ schoolId })
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('teacherId', 'teacherName employeeId contact status')
    .sort({ createdAt: -1 })
    .lean();
};

export const deleteClassTeacherAssignmentService = async (schoolId: string, id: string) => {
  const assignment = await ClassTeacherAssignment.findOneAndDelete({ _id: id, schoolId });
  if (!assignment) {
    throw createHttpError('Class teacher assignment not found', 404);
  }
  return assignment;
};

const buildRoutineSlots = (
  workingDays: RoutineDay[],
  periods: IPeriodConfig[],
) => {
  const subjectPeriods = periods.filter((period) => !period.isBreak);
  const breakPeriods = periods.filter((period) => period.isBreak);
  const allSlots: Array<{
    day: RoutineDay;
    period: IPeriodConfig;
    slotType: 'SUBJECT' | 'BREAK' | 'NA';
  }> = [];

  for (const day of workingDays) {
    for (const period of subjectPeriods) {
      allSlots.push({ day, period, slotType: 'NA' });
    }
    for (const period of breakPeriods) {
      allSlots.push({ day, period, slotType: 'BREAK' });
    }
  }

  return { subjectPeriods, breakPeriods, allSlots };
};

type GeneratedRoutineSlot = {
  dayOfWeek: RoutineDay;
  position: number;
  startTime: string;
  endTime: string;
  slotType: 'SUBJECT' | 'NA';
  subjectId: mongoose.Types.ObjectId | null;
  teacherId: mongoose.Types.ObjectId | null;
  roomNumber: string;
};

export const getRoutineService = async (schoolId: string, classId: string, sectionId: string) => {
  let routine = await ClassRoutine.find({ schoolId, classId, sectionId })
    .populate('subjectId', 'name code')
    .populate('teacherId', 'teacherName employeeId contact status')
    .sort({ dayOfWeek: 1, position: 1 })
    .lean();

  if (routine.length > 0) {
    return { initialized: true, data: routine };
  }

  const config = await SchoolScheduleConfig.findOne({ schoolId }).lean();
  if (!config) {
    return { initialized: false, data: [] };
  }

  const newSlots = config.workingDays.flatMap((day) =>
    config.periods.map((period) => ({
      schoolId,
      classId,
      sectionId,
      dayOfWeek: day,
      position: period.position,
      startTime: period.startTime,
      endTime: period.endTime,
      slotType: period.isBreak ? 'BREAK' : 'NA',
      subjectId: null,
      teacherId: null,
      roomNumber: '',
    })),
  );

  if (newSlots.length > 0) {
    await ClassRoutine.insertMany(newSlots);
    routine = await ClassRoutine.find({ schoolId, classId, sectionId })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'teacherName employeeId contact status')
      .sort({ dayOfWeek: 1, position: 1 })
      .lean();
  }

  return { initialized: true, data: routine };
};

export const updateRoutineCellService = async (
  schoolId: string,
  id: string,
  payload: IRoutineCellUpdateInput,
) => {
  const cell = await ClassRoutine.findOne({ _id: id, schoolId });
  if (!cell) {
    throw createHttpError('Routine slot not found', 404);
  }

  if (payload.slotType === 'SUBJECT') {
    if (!payload.subjectId) {
      throw createHttpError('Subject is required for subject slot', 400);
    }

    if (payload.teacherId) {
      await checkTeacherConflict(
        schoolId,
        payload.teacherId,
        cell.dayOfWeek,
        cell.startTime,
        cell.endTime,
        id,
      );
    }

    cell.slotType = 'SUBJECT';
    cell.subjectId = payload.subjectId as any;
    cell.teacherId = (payload.teacherId || null) as any;
    cell.roomNumber = payload.roomNumber || '';
  } else {
    cell.slotType = payload.slotType;
    cell.subjectId = null;
    cell.teacherId = null;
    cell.roomNumber = '';
  }

  await cell.save();

  return await ClassRoutine.findById(cell._id)
    .populate('subjectId', 'name code')
    .populate('teacherId', 'teacherName employeeId contact status')
    .lean();
};

export const swapRoutineCellsService = async (schoolId: string, idA: string, idB: string) => {
  const cellA = await ClassRoutine.findOne({ _id: idA, schoolId });
  const cellB = await ClassRoutine.findOne({ _id: idB, schoolId });

  if (!cellA || !cellB) {
    throw createHttpError('One or both routine slots not found', 404);
  }

  if (cellA.dayOfWeek !== cellB.dayOfWeek) {
    throw createHttpError('Swapping is only allowed between slots of the same day', 400);
  }

  const cellATemp = {
    slotType: cellA.slotType,
    subjectId: cellA.subjectId,
    teacherId: cellA.teacherId,
    roomNumber: cellA.roomNumber,
  };

  const cellBTemp = {
    slotType: cellB.slotType,
    subjectId: cellB.subjectId,
    teacherId: cellB.teacherId,
    roomNumber: cellB.roomNumber,
  };

  if (cellBTemp.slotType === 'SUBJECT' && cellBTemp.teacherId) {
    const teacherId = cellBTemp.teacherId.toString();
    await checkTeacherConflict(
      schoolId,
      teacherId,
      String(cellA.dayOfWeek),
      String(cellA.startTime),
      String(cellA.endTime),
      String(cellA._id),
    );
  }

  if (cellATemp.slotType === 'SUBJECT' && cellATemp.teacherId) {
    const teacherId = cellATemp.teacherId.toString();
    await checkTeacherConflict(
      schoolId,
      teacherId,
      String(cellB.dayOfWeek),
      String(cellB.startTime),
      String(cellB.endTime),
      String(cellB._id),
    );
  }

  cellA.slotType = cellBTemp.slotType;
  cellA.subjectId = (cellBTemp.subjectId ?? null) as mongoose.Types.ObjectId | null;
  cellA.teacherId = (cellBTemp.teacherId ?? null) as mongoose.Types.ObjectId | null;
  cellA.roomNumber = (cellBTemp.roomNumber ?? '') as string;

  cellB.slotType = cellATemp.slotType;
  cellB.subjectId = (cellATemp.subjectId ?? null) as mongoose.Types.ObjectId | null;
  cellB.teacherId = (cellATemp.teacherId ?? null) as mongoose.Types.ObjectId | null;
  cellB.roomNumber = (cellATemp.roomNumber ?? '') as string;

  await cellA.save();
  await cellB.save();

  return { cellA, cellB };
};

export const updateBulkRoomService = async (
  schoolId: string,
  classId: string,
  sectionId: string,
  roomNumber?: string,
) => {
  if (!classId || !sectionId) {
    throw createHttpError('classId and sectionId are required', 400);
  }

  return await ClassRoutine.updateMany(
    { schoolId, classId, sectionId, slotType: 'SUBJECT' },
    { $set: { roomNumber: roomNumber || '' } },
  );
};

export const deleteRoutineService = async (
  schoolId: string,
  sectionIds?: string[],
) => {
  if (sectionIds && sectionIds.length > 0) {
    // Delete routines for specific sections
    const result = await ClassRoutine.deleteMany({
      schoolId,
      sectionId: { $in: sectionIds },
    });
    return {
      deletedCount: result.deletedCount,
      message: `Deleted routines for ${sectionIds.length} section(s)`,
    };
  }

  // Delete all routines for the school
  const result = await ClassRoutine.deleteMany({ schoolId });
  return {
    deletedCount: result.deletedCount,
    message: 'Deleted all routines for the school',
  };
};

export const generateRoutineService = async (
  schoolId: string,
  payload: IGenerateRoutineInput,
) => {
  const { overwrite = false, roomNumbers = {} } = payload;

  // Parallelize initial data fetching
  const [config, allSections] = await Promise.all([
    SchoolScheduleConfig.findOne({ schoolId }).lean(),
    SectionModel.find({ schoolId }).lean(),
  ]);

  if (!config) {
    throw createHttpError('Schedule configuration not found. Please configure working days and periods first.', 400);
  }

  if (!config.workingDays || config.workingDays.length === 0) {
    throw createHttpError('No working days configured.', 400);
  }

  const workingPeriods = config.periods.filter((period) => !period.isBreak);
  if (workingPeriods.length === 0) {
    throw createHttpError('No non-break periods configured.', 400);
  }

  let sectionIds = payload.sectionIds || [];
  if (sectionIds.length === 0) {
    sectionIds = allSections.map((section) => section._id.toString());
  }

  if (sectionIds.length === 0) {
    throw createHttpError('No classes or sections found to generate routine for.', 400);
  }

  if (!overwrite) {
    const existingRoutine = await ClassRoutine.findOne({
      schoolId,
      sectionId: { $in: sectionIds },
      slotType: 'SUBJECT',
    }).lean();

    if (existingRoutine) {
      throw createHttpError('Existing routine data present', 409);
    }
  }

  // Parallelize section and mapping queries
  const [sections, mappings] = await Promise.all([
    SectionModel.find({ schoolId, _id: { $in: sectionIds } }).populate('classId').lean(),
    SubjectTeacherMapping.find({
      schoolId,
      sectionId: { $in: sectionIds },
    })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'teacherName employeeId contact status')
      .lean(),
  ]);

  const sectionMap = new Map<string, any>();
  for (const section of sections) {
    sectionMap.set(section._id.toString(), section);
  }

  if (mappings.length === 0) {
    throw createHttpError('No subject-teacher mappings found. Please map subjects to teachers and assign period counts first.', 400);
  }

  const mappingsBySection: Record<string, any[]> = {};
  for (const mapping of mappings) {
    const sectionKey = mapping.sectionId.toString();
    if (!mappingsBySection[sectionKey]) {
      mappingsBySection[sectionKey] = [];
    }
    mappingsBySection[sectionKey].push(mapping);
  }

  const totalSlotsPerWeek = config.workingDays.length * workingPeriods.length;

  for (const sectionId of sectionIds) {
    const sectionMappings = mappingsBySection[sectionId] || [];
    if (sectionMappings.length === 0) {
      const section = sectionMap.get(sectionId);
      throw createHttpError(
        `No subject-teacher mappings found for ${getClassName(section?.classId)} section ${getSectionName(section)}`,
        400,
      );
    }

    const totalRequired = sectionMappings.reduce((sum, mapping) => sum + mapping.periodsPerWeek, 0);
    if (totalRequired > totalSlotsPerWeek) {
      const section = sectionMap.get(sectionId);
      throw createHttpError(
        `Class ${getClassName(section?.classId)} section ${getSectionName(section)} requires ${totalRequired} periods per week, but only ${totalSlotsPerWeek} slots are available.`,
        400,
      );
    }
  }

  const teacherTotalLoads: Record<string, { name: string; load: number }> = {};
  const allSchoolMappings = await SubjectTeacherMapping.find({ schoolId }).populate('teacherId', 'teacherName').lean();
  for (const mapping of allSchoolMappings) {
    const teacherKey = getEntityIdString(mapping.teacherId);
    if (!teacherKey) {
      continue;
    }

    const teacherName = getTeacherName(mapping.teacherId);
    if (!teacherTotalLoads[teacherKey]) {
      teacherTotalLoads[teacherKey] = { name: teacherName, load: 0 };
    }
    teacherTotalLoads[teacherKey].load += mapping.periodsPerWeek;
  }

  for (const [teacherId, teacherLoad] of Object.entries(teacherTotalLoads)) {
    if (teacherLoad.load > totalSlotsPerWeek) {
      throw createHttpError(
        `Teacher ${teacherLoad.name} is assigned to teach ${teacherLoad.load} periods per week across the school, which exceeds the maximum available slots (${totalSlotsPerWeek}).`,
        400,
      );
    }
    if (!teacherId) {
      continue;
    }
  }

  const otherRoutines = await ClassRoutine.find({
    schoolId,
    sectionId: { $nin: sectionIds },
    slotType: 'SUBJECT',
    teacherId: { $ne: null },
  }).lean();

  const globalTeacherLocks = new Set<string>();
  for (const routine of otherRoutines) {
    if (routine.teacherId == null) {
      continue;
    }

    globalTeacherLocks.add(`${routine.teacherId.toString()}:${routine.dayOfWeek}:${routine.position}`);
  }

  const sortedSections = [...sections].sort((left, right) => {
    const leftLoad = (mappingsBySection[left._id.toString()] || []).reduce((sum, mapping) => sum + mapping.periodsPerWeek, 0);
    const rightLoad = (mappingsBySection[right._id.toString()] || []).reduce((sum, mapping) => sum + mapping.periodsPerWeek, 0);
    return rightLoad - leftLoad;
  });

  const finalRoutines: Array<{
    sectionId: mongoose.Types.ObjectId;
    classId: mongoose.Types.ObjectId;
    slots: GeneratedRoutineSlot[];
  }> = [];

  const solveSection = (section: any, locks: Set<string>, sectionMappings: any[]) => {
    // Pre-compute maxPerDay for each mapping to avoid repeated calculations
    const maxPerDayMap = new Map<string, number>();
    for (const mapping of sectionMappings) {
      const subjectId = mapping.subjectId._id.toString();
      maxPerDayMap.set(subjectId, Math.ceil(mapping.periodsPerWeek / config.workingDays.length));
    }

    // Create slots with interleaved day distribution for better backtracking
    const slots: Array<{
      day: RoutineDay;
      period: IPeriodConfig;
    }> = [];

    // Interleave slots across days to distribute subjects evenly
    for (let periodIndex = 0; periodIndex < workingPeriods.length; periodIndex += 1) {
      const period = workingPeriods[periodIndex];
      if (!period) continue;
      for (const day of config.workingDays) {
        slots.push({ day, period });
      }
    }

    const totalRequired = sectionMappings.reduce((sum, mapping) => sum + mapping.periodsPerWeek, 0);
    const naCount = totalSlotsPerWeek - totalRequired;

    // Sort demands by periods per week (descending) - most constrained first
    // This helps backtracking find valid solutions faster
    const demands: Array<{ subjectId: string | null; teacherId: string | null; count: number }> = [];
    for (const mapping of sectionMappings) {
      demands.push({
        subjectId: mapping.subjectId._id.toString(),
        teacherId: mapping.teacherId._id.toString(),
        count: mapping.periodsPerWeek,
      });
    }

    // Sort by count descending (most constrained subjects first)
    demands.sort((a, b) => b.count - a.count);

    if (naCount > 0) {
      demands.push({ subjectId: null, teacherId: null, count: naCount });
    }

    const assignment = new Array<number | null>(slots.length).fill(null);
    const dailySubjectCount = new Map<string, number>();

    const backtrack = (slotIndex: number): boolean => {
      if (slotIndex === slots.length) {
        return true;
      }

      const slot = slots[slotIndex];
      if (!slot) {
        return false;
      }

      for (let demandIndex = 0; demandIndex < demands.length; demandIndex += 1) {
        const demand = demands[demandIndex];
        if (!demand) {
          continue;
        }
        if (demand.count === 0) {
          continue;
        }

        if (demand.subjectId) {
          const lockKey = `${demand.teacherId ?? ''}:${slot.day}:${slot.period.position}`;
          if (locks.has(lockKey)) {
            continue;
          }

          const previousSlotIndex = slotIndex - 1;
          if (previousSlotIndex >= 0) {
            const previousSlot = slots[previousSlotIndex];
            if (!previousSlot) {
              continue;
            }
            if (previousSlot.day === slot.day && previousSlot.period.position === slot.period.position - 1) {
              const previousDemandIndex = assignment[previousSlotIndex];
              if (typeof previousDemandIndex !== 'number') {
                continue;
              }

              const previousDemand = demands[previousDemandIndex];
              if (previousDemand && previousDemand.subjectId === demand.subjectId) {
                continue;
              }
            }
          }

          // Use pre-computed maxPerDay
          const maxPerDay = maxPerDayMap.get(demand.subjectId) || 0;
          const daySubjectKey = `${slot.day}:${demand.subjectId}`;
          const currentCount = dailySubjectCount.get(daySubjectKey) || 0;
          if (currentCount >= maxPerDay) {
            continue;
          }
        }

        demand.count -= 1;
        assignment[slotIndex] = demandIndex;

        if (demand.subjectId) {
          const daySubjectKey = `${slot.day}:${demand.subjectId}`;
          dailySubjectCount.set(daySubjectKey, (dailySubjectCount.get(daySubjectKey) || 0) + 1);
        }

        if (backtrack(slotIndex + 1)) {
          return true;
        }

        demand.count += 1;
        assignment[slotIndex] = null;

        if (demand.subjectId) {
          const daySubjectKey = `${slot.day}:${demand.subjectId}`;
          dailySubjectCount.set(daySubjectKey, (dailySubjectCount.get(daySubjectKey) || 0) - 1);
        }
      }

      return false;
    };

    if (!backtrack(0)) {
      return null;
    }

    return slots.map((slot, slotIndex) => {
      const demandIndex = assignment[slotIndex];
      if (typeof demandIndex !== 'number') {
        return {
          dayOfWeek: slot.day,
          position: slot.period.position,
          startTime: slot.period.startTime,
          endTime: slot.period.endTime,
          slotType: 'NA' as const,
          subjectId: null,
          teacherId: null,
          roomNumber: '',
        } satisfies GeneratedRoutineSlot;
      }

      const demand = demands[demandIndex];
      const slotType: 'SUBJECT' | 'NA' = demand && demand.subjectId ? 'SUBJECT' : 'NA';
      return {
        dayOfWeek: slot.day,
        position: slot.period.position,
        startTime: slot.period.startTime,
        endTime: slot.period.endTime,
        slotType,
        subjectId: demand && demand.subjectId ? new mongoose.Types.ObjectId(demand.subjectId) : null,
        teacherId: demand && demand.teacherId ? new mongoose.Types.ObjectId(demand.teacherId) : null,
        roomNumber: '',
      } satisfies GeneratedRoutineSlot;
    });
  };

  const solveAllSections = (sectionIndex: number): boolean => {
    if (sectionIndex === sortedSections.length) {
      return true;
    }

    const section = sortedSections[sectionIndex];
    if (!section) {
      return false;
    }
    const sectionMappings = mappingsBySection[section._id.toString()] || [];
    const sectionSolution = solveSection(section, globalTeacherLocks, sectionMappings);

    if (!sectionSolution) {
      return false;
    }

    const addedLocks: string[] = [];
    for (const slot of sectionSolution) {
      if (slot.teacherId) {
        const lockKey = `${slot.teacherId.toString()}:${slot.dayOfWeek}:${slot.position}`;
        globalTeacherLocks.add(lockKey);
        addedLocks.push(lockKey);
      }
    }

    finalRoutines.push({
      sectionId: section._id,
      classId: (section.classId as any)._id,
      slots: sectionSolution,
    });

    if (solveAllSections(sectionIndex + 1)) {
      return true;
    }

    for (const lockKey of addedLocks) {
      globalTeacherLocks.delete(lockKey);
    }

    finalRoutines.pop();
    return false;
  };

  if (!solveAllSections(0)) {
    throw createHttpError(
      'Could not generate a conflict-free routine. Please review subject-teacher mappings and teacher loads.',
      422,
    );
  }

  await ClassRoutine.deleteMany({ schoolId, sectionId: { $in: sectionIds } });

  const documents: Array<Record<string, unknown>> = [];

  for (const item of finalRoutines) {
    const sectionRoom = roomNumbers[item.sectionId.toString()] || '';

    for (const slot of item.slots) {
      documents.push({
        schoolId: new mongoose.Types.ObjectId(schoolId),
        classId: item.classId,
        sectionId: item.sectionId,
        dayOfWeek: slot.dayOfWeek,
        position: slot.position,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotType: slot.slotType,
        subjectId: slot.subjectId,
        teacherId: slot.teacherId,
        roomNumber: slot.slotType === 'SUBJECT' ? sectionRoom : '',
      });
    }

    for (const day of config.workingDays) {
      for (const period of config.periods.filter((item) => item.isBreak)) {
        documents.push({
          schoolId: new mongoose.Types.ObjectId(schoolId),
          classId: item.classId,
          sectionId: item.sectionId,
          dayOfWeek: day,
          position: period.position,
          startTime: period.startTime,
          endTime: period.endTime,
          slotType: 'BREAK',
          subjectId: null,
          teacherId: null,
          roomNumber: '',
        });
      }
    }
  }

  if (documents.length > 0) {
    await ClassRoutine.insertMany(documents);
  }

  return {
    success: true,
    totalSlotsFilled: documents.length,
    classSectionsProcessed: sectionIds.length,
  };
};