import { z } from "zod";

export const ExpenseSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(["cash", "bank_transfer", "cheque", "online"]).default("cash"),
  date: z.string().or(z.date()).optional(),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export type IExpenseInput = z.infer<typeof ExpenseSchema>;
