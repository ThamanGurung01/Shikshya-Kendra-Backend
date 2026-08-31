import { z } from "zod";

export const FeeHeadSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  title: z.string().min(1, "Title is required"),
  feeType: z.enum(["monthly", "one_time", "term_wise"]).default("monthly"),
  defaultAmount: z.number().min(0, "Default amount cannot be negative"),
  applicableMonth: z.number().min(1).max(12).optional(),
  applicableClassIds: z.array(z.string()).optional(),
});

export type IFeeHeadInput = z.infer<typeof FeeHeadSchema>;
