import { z } from 'zod';

const routineDayValues = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const periodSchema = z.object({
  position: z.number().int().min(1, 'Period position is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isBreak: z.boolean().default(false),
  label: z.string().optional(),
});

export const schoolScheduleConfigSchema = z.object({
  workingDays: z.array(z.enum(routineDayValues)).min(1, 'At least one working day is required'),
  periods: z.array(periodSchema).min(1, 'At least one period is required'),
});

export const subjectTeacherMappingSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  periodsPerWeek: z.number().int().min(1, 'Periods per week must be at least 1').max(30),
});

export const classTeacherAssignmentSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
});

export const generateRoutineSchema = z.object({
  sectionIds: z.array(z.string().min(1)).optional(),
  overwrite: z.boolean().optional(),
  roomNumbers: z.record(z.string(), z.string()).optional(),
});

export const routineCellUpdateSchema = z.object({
  slotType: z.enum(['SUBJECT', 'BREAK', 'NA']),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  roomNumber: z.string().optional(),
});

export const routineSwapSchema = z.object({
  idA: z.string().min(1, 'First routine slot ID is required'),
  idB: z.string().min(1, 'Second routine slot ID is required'),
});

export const bulkRoomSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  roomNumber: z.string().optional(),
});

export type ISchoolScheduleConfigInput = z.infer<typeof schoolScheduleConfigSchema>;
export type ISubjectTeacherMappingInput = z.infer<typeof subjectTeacherMappingSchema>;
export type IClassTeacherAssignmentInput = z.infer<typeof classTeacherAssignmentSchema>;
export type IGenerateRoutineInput = z.infer<typeof generateRoutineSchema>;
export type IRoutineCellUpdateInput = z.infer<typeof routineCellUpdateSchema>;