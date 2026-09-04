import { z } from "zod";

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY"]),
  remarks: z.string().optional(),
});

export const submitAttendanceSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  sectionId: z.string().min(1, "Section ID is required"),
  academicYearId: z.string().min(1, "Academic Year ID is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Valid date is required"),
  records: z.array(attendanceRecordSchema),
});

export const scanQrAttendanceSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
  date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), "Valid date format required"),
});
