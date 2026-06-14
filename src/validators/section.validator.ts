import { z } from 'zod';

export const SectionSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  name: z.string().min(1, 'Name is required'),
});

export type ISectionInput = z.infer<typeof SectionSchema>;