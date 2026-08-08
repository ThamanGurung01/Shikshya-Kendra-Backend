import { z } from 'zod';

export const UpdateWlmConfigSchema = z.object({
  examWeight: z.number().min(0).max(1),
  attendanceWeight: z.number().min(0).max(1),
  assignmentWeight: z.number().min(0).max(1),
}).refine(
  (data) => Math.abs(data.examWeight + data.attendanceWeight + data.assignmentWeight - 1.0) <= 0.001,
  { message: 'Weights must sum to 1.0' },
);

export type IUpdateWlmConfigInput = z.infer<typeof UpdateWlmConfigSchema>;
