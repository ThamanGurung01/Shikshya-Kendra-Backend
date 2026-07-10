import { z } from "zod";

export const createAssignmentSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  sectionId: z.string().min(1, "Section ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().min(1, "Description is required"),
  files: z.array(z.string()).default([]),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Due Date must be a valid date string"),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").trim().optional(),
  description: z.string().min(1, "Description is required").optional(),
  files: z.array(z.string()).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Due Date must be a valid date string").optional(),
});

export const reviewSubmissionSchema = z.object({
  status: z.enum(["COMPLETED", "REDO"] as const),
  feedback: z.string().optional().default(""),
});

export const studentSubmitSchema = z.object({
  studentNote: z.string().optional().default(""),
  files: z.array(z.string()).default([]),
});
