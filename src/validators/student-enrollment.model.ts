import { z } from "zod";

export const StudentEnrollmentSchema = z.object({
    studentId: z.string().optional().refine(v=>v!==undefined),
    schoolId: z.string().min(1, "schoolId is required"),
    academicYearId: z.string().min(1, "academicYearId is required"),
    classId: z.string().min(1, "classId is required"),
    sectionId: z.string().min(1, "sectionId is required"),
    rollNumber: z.coerce.number().int().optional(),
    promotedFromEnrollmentId: z.string().optional().refine(v=>v!==undefined),
    studentEnrollmentStatus: z.enum([
            "active",
            "promoted",
            "failed",
            "transferred",
            "graduated",
            "dropped",
        ]).default("active"),

});

export type IStudentEnrollmentInput = z.infer<typeof StudentEnrollmentSchema>;