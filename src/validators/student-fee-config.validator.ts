import { z } from "zod";

export const StudentFeeConfigSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  customMonthlyFee: z.number().nullable().optional(),
  discountType: z.enum(["none", "percentage", "flat"]).default("none"),
  discountValue: z.number().min(0, "Discount value cannot be negative").default(0),
  discountReason: z.string().optional(),
  hasTransport: z.boolean().default(false),
  transportFee: z.number().min(0, "Transport fee cannot be negative").default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type IStudentFeeConfigInput = z.infer<typeof StudentFeeConfigSchema>;
