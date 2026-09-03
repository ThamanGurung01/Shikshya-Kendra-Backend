import { z } from "zod";

export const SinglePromotionItemSchema = z.object({
  studentId: z.string().min(1, "studentId is required"),
  action: z.enum(["promote", "retain", "graduate"]).default("promote"),
  targetSectionId: z.string().optional(),
  targetRollNumber: z.coerce.number().int().positive().optional(),
});

export const BulkPromotionSchema = z.object({
  sourceAcademicYearId: z.string().min(1, "sourceAcademicYearId is required"),
  sourceClassId: z.string().min(1, "sourceClassId is required"),
  sourceSectionId: z.string().optional(),
  targetAcademicYearId: z.string().min(1, "targetAcademicYearId is required"),
  targetClassId: z.string().min(1, "targetClassId is required"),
  targetSectionId: z.string().min(1, "targetSectionId is required"),
  promotions: z.array(SinglePromotionItemSchema).min(1, "At least one student must be selected for promotion"),
});

export const PromotionPreviewQuerySchema = z.object({
  sourceAcademicYearId: z.string().min(1, "sourceAcademicYearId is required"),
  sourceClassId: z.string().min(1, "sourceClassId is required"),
  sourceSectionId: z.string().optional(),
  targetAcademicYearId: z.string().optional(),
});

export type ISinglePromotionItem = z.infer<typeof SinglePromotionItemSchema>;
export type IBulkPromotionInput = z.infer<typeof BulkPromotionSchema>;
export type IPromotionPreviewQuery = z.infer<typeof PromotionPreviewQuerySchema>;
