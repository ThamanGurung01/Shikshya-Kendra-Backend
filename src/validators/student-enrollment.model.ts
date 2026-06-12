import { z } from "zod";

export const StudentEnrollmentSchema = z.object({
    studentId: z.string().optional().refine(v=>v!==undefined),
    schoolId: z.string().min(1, "schoolId is required"),
    academicYearId: z.string().min(1, "academicYearId is required"),
    classId: z.string().min(1, "classId is required"),
    sectionId: z.string().min(1, "sectionId is required"),
    rollNumber: z.number().int().min(1, "rollNumber is required"),
    promotedFromEnrollmentId: z.string().optional().refine(v=>v!==undefined),
    studentEnrollmentStatus: z.enum([
            "enrolled",
            "pending",
            "waitlisted",
            "dropped",
            "completed",
            "failed",
            "withdrawn",
            "cancelled",
        ]).default("pending"),

});

export type IStudentEnrollmentInput = z.infer<typeof StudentEnrollmentSchema>;