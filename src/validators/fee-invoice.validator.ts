import { z } from "zod";

export const ReceiptItemSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  month: z.number().min(1).max(12).optional(),
  feeHeadId: z.string().optional(),
  amount: z.number().min(0, "Item amount cannot be negative"),
});

export const CollectFeePaymentSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  academicYearId: z.string().min(1, "Academic Year ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  sectionId: z.string().optional(),
  paidMonths: z.array(z.number().min(1).max(12)).default([]),
  items: z.array(ReceiptItemSchema).min(1, "At least one item is required"),
  discountAmount: z.number().min(0).default(0),
  proRatioWaiver: z.number().min(0).default(0),
  proRatioReason: z.string().optional(),
  paymentMethod: z.enum(["cash", "cheque", "bank_transfer", "esewa"]).default("cash"),
  paymentReference: z.string().optional(),
  paidAmount: z.number().min(0, "Paid amount cannot be negative"),
  remarks: z.string().optional(),
});

export type ICollectFeePaymentInput = z.infer<typeof CollectFeePaymentSchema>;
