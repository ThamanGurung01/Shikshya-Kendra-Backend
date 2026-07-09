import { z } from "zod";

export const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  audience: z.enum(["all", "teachers", "staffs", "students", "parents"]).default("all"),
  showOnLogin: z.boolean().optional().default(false),
  loginMessageExpiry: z.string().nullable().optional(),
  targetClassId: z.string().nullable().optional(),
  targetSectionId: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.showOnLogin) {
    if (!data.loginMessageExpiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry date is required when showing on login screen",
        path: ["loginMessageExpiry"],
      });
      return;
    }

    const expiryDate = new Date(data.loginMessageExpiry);
    expiryDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry date cannot be in the past",
        path: ["loginMessageExpiry"],
      });
    }
  }
});

export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  audience: z.enum(["all", "teachers", "staffs", "students", "parents"]).optional(),
  showOnLogin: z.boolean().optional(),
  loginMessageExpiry: z.string().nullable().optional(),
  targetClassId: z.string().nullable().optional(),
  targetSectionId: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.showOnLogin) {
    if (!data.loginMessageExpiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry date is required when showing on login screen",
        path: ["loginMessageExpiry"],
      });
      return;
    }

    const expiryDate = new Date(data.loginMessageExpiry);
    expiryDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry date cannot be in the past",
        path: ["loginMessageExpiry"],
      });
    }
  }
});

export type IAnnouncementInput = z.infer<typeof AnnouncementSchema>;
export type IUpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;
