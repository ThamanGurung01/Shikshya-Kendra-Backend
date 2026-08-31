import { z } from "zod";

export const SalaryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
});

export const StaffSalaryConfigSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  userId: z.string().min(1, "User ID is required"),
  staffRole: z.enum(["teacher", "accountant", "librarian", "admin", "staff"]),
  staffRefId: z.string().optional(),
  basicSalary: z.number().min(0, "Basic salary cannot be negative"),
  allowances: z.array(SalaryItemSchema).default([]),
  deductions: z.array(SalaryItemSchema).default([]),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const BatchPayrollSchema = z.object({
  month: z.number().min(1).max(12, "Month must be between 1 and 12"),
  year: z.number().min(2000, "Invalid year"),
});

export const DisbursePayrollSchema = z.object({
  paymentMethod: z.enum(["cash", "cheque", "bank_transfer"]).default("bank_transfer"),
  paymentDate: z.string().or(z.date()).optional(),
  transactionReference: z.string().optional(),
});

export type IStaffSalaryConfigInput = z.infer<typeof StaffSalaryConfigSchema>;
export type IBatchPayrollInput = z.infer<typeof BatchPayrollSchema>;
export type IDisbursePayrollInput = z.infer<typeof DisbursePayrollSchema>;
