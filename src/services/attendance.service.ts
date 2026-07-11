import { Attendance } from "../models/attendance.model";
import { AcademicYear } from "../models/academic-year.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { ClassTeacherAssignment } from "../models/class-teacher-assignment.model";
import { ClassRoutine } from "../models/class-routine.model";
import { ApiError } from "../utils/error.util";
import { Teacher } from "../models/teacher.model";

// Helper: Attendance auth check
export async function isAuthorizedForAttendance(
  userId: string,
  role: string,
  classId: string,
  sectionId: string,
  schoolId: string,
): Promise<boolean> {
  const adminRoles = ["oadmin", "admin", "superadmin"];
  if (adminRoles.includes(role)) return true;

  if (role !== "teacher") return false;

  const teacher = await Teacher.findOne({ userId, schoolId }).lean();
  if (!teacher) return false;

  // 1. Is designated Class Teacher?
  const isClassTeacher = await ClassTeacherAssignment.exists({
    classId,
    sectionId,
    teacherId: teacher._id
  });
  if (isClassTeacher) return true;

  // 2. Is subject teacher in routine?
  const isSubjectTeacher = await ClassRoutine.exists({
    classId,
    sectionId,
    teacherId: teacher._id,
    slotType: "SUBJECT"
  });
  if (isSubjectTeacher) return true;

  return false;
}

export const submitAttendanceService = async (
  schoolId: string,
  userId: string,
  role: string,
  payload: any
) => {
  const { classId, sectionId, academicYearId, date, records } = payload;

  if (!classId || !sectionId || !academicYearId || !date || !records) {
    throw new ApiError(400, "Missing parameters");
  }

  // Check authorization
  const auth = await isAuthorizedForAttendance(userId, role, classId, sectionId, schoolId);
  if (!auth) {
    throw new ApiError(403, "You are not authorized to submit attendance for this class section");
  }

  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({
    schoolId,
    classId,
    sectionId,
    date: startOfDay
  });

  if (attendance) {
    attendance.records = records;
    attendance.takenBy = userId as any;
    await attendance.save();
  } else {
    attendance = new Attendance({
      schoolId,
      academicYearId,
      classId,
      sectionId,
      date: startOfDay,
      takenBy: userId,
      records
    });
    await attendance.save();
  }

  return attendance;
};

export const getAttendanceService = async (
  schoolId: string,
  userId: string,
  role: string,
  classId: string,
  sectionId: string,
  dateStr: string,
  academicYearId?: string
) => {
  let targetYearId = academicYearId;
  if (!targetYearId) {
    const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
    if (!currentYear) {
      throw new ApiError(400, "Active academic year not found");
    }
    targetYearId = currentYear._id.toString();
  }

  // Validate authorization to view or take attendance
  const auth = await isAuthorizedForAttendance(userId, role, classId, sectionId, schoolId);
  
  const startOfDay = new Date(dateStr);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    schoolId,
    classId,
    sectionId,
    date: startOfDay
  }).populate("records.studentId", "name email").lean();

  if (attendance) {
    return {
      exists: true,
      authorized: auth,
      data: attendance
    };
  }

  // Pre-populate with student roster
  const enrollments = await StudentEnrollment.find({
    schoolId,
    classId,
    sectionId,
    academicYearId: targetYearId,
    studentEnrollmentStatus: "active"
  })
    .populate("studentId", "name email")
    .sort({ rollNumber: 1 })
    .lean();

  const mockRecords = enrollments.map((env: any) => ({
    studentId: env.studentId,
    status: "PRESENT",
    remarks: ""
  }));

  return {
    exists: false,
    authorized: auth,
    data: {
      schoolId,
      academicYearId: targetYearId,
      classId,
      sectionId,
      date: startOfDay,
      records: mockRecords
    }
  };
};

export const getAssignedClassService = async (
  schoolId: string,
  userId: string,
  role: string
) => {
  if (role !== "teacher") {
    throw new ApiError(403, "Only teachers have class assignments");
  }

  const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
  if (!currentYear) {
    throw new ApiError(400, "Active academic year not found");
  }

  const teacher = await Teacher.findOne({ schoolId, userId }).lean();
  if (!teacher) {
    return {
      assigned: false
    };
  }

  const assignment = await ClassTeacherAssignment.findOne({
    schoolId,
    teacherId: teacher._id
  })
    .populate("classId", "name")
    .populate("sectionId", "name")
    .lean();

  if (!assignment) {
    return {
      assigned: false
    };
  }

  return {
    assigned: true,
    classId: assignment.classId?._id?.toString() || "",
    className: (assignment.classId as any)?.name || "",
    sectionId: assignment.sectionId?._id?.toString() || "",
    sectionName: (assignment.sectionId as any)?.name || "",
    academicYearId: currentYear._id.toString()
  };
};
