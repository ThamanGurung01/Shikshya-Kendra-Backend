import { z } from 'zod';

export const ExamSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  name: z.string().min(1, 'Name is required'),
  classes: z.array(z.string()).min(1, 'At least one class is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  allowedDays: z.array(z.string()).min(1, 'At least one allowed day is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  note: z.string().optional(),
  classTimes: z.array(z.object({
    classId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })).optional(),
  status: z.enum(['draft', 'upcoming', 'active', 'ended']).optional(),
  gradingSystem: z.enum(['gpa', 'percentage']).optional(),
  examConfiguration: z.array(z.object({
    classId: z.string().min(1, 'Class ID is required'),
    subjects: z.array(z.object({
      subjectId: z.string().min(1, 'Subject ID is required'),
      theoryFullMarks: z.number().min(0),
      theoryPassMarks: z.number().min(0),
      practicalFullMarks: z.number().min(0),
      practicalPassMarks: z.number().min(0),
    })),
  })).optional(),
});

export type IExamInput = z.infer<typeof ExamSchema>;

export const ExamRoutineSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  date: z.string().or(z.date()),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  roomNumber: z.string().optional(),
});

export type IExamRoutineInput = z.infer<typeof ExamRoutineSchema>;
