import { z } from 'zod';

export const CreateResultSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  name: z.string().min(1, 'Result name is required'),
  classIds: z.array(z.string()).min(1, 'At least one class is required'),
});

export const UpdateResultStatusSchema = z.object({
  status: z.enum(['processing', 'draft', 'published']),
});

export type ICreateResultInput = z.infer<typeof CreateResultSchema>;
export type IUpdateResultStatusInput = z.infer<typeof UpdateResultStatusSchema>;
