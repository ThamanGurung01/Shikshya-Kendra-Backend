import { z } from 'zod';

export const UpdateGradeEntriesSchema = z.object({
  entries: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      theoryMarks: z.number().min(0).nullable().optional(),
      practicalMarks: z.number().min(0).nullable().optional(),
      isAbsent: z.boolean().default(false),
      remarks: z.string().optional().nullable(),
    }),
  ).min(1, 'At least one entry is required'),
});

export type IUpdateGradeEntriesInput = z.infer<typeof UpdateGradeEntriesSchema>;
