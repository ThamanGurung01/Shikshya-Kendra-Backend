import { z } from 'zod';

export const SubjectSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
});

export type ISubjectInput = z.infer<typeof SubjectSchema>;