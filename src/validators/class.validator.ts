import { z } from 'zod';

export const ClassSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  name: z.string().min(1, 'Name is required'),
});

export type IClassInput = z.infer<typeof ClassSchema>;