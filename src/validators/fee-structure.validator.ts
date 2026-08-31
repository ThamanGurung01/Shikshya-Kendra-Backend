import { z } from "zod";

export const FeeStructureSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  academicYearId: z.string().min(1, "Academic Year ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  monthlyFee: z.number().min(0, "Monthly fee cannot be negative"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type IFeeStructureInput = z.infer<typeof FeeStructureSchema>;
