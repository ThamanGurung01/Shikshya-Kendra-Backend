import { Attendance } from "../models/attendance.model";
import { AcademicYear } from "../models/academic-year.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { ClassTeacherAssignment } from "../models/class-teacher-assignment.model";
import { ClassRoutine } from "../models/class-routine.model";
import { ApiError } from "../utils/error.util";
import { Teacher } from "../models/teacher.model";
import { Student } from "../models/student.model";
import { analyzeStudentAttendance } from "../utils/sliding-window.util";

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

export const scanQrAttendanceService = async (
  schoolId: string,
  userId: string,
  role: string,
  payload: { qrData: string; date?: string | undefined }
) => {
  const { qrData, date } = payload;
  if (!qrData) {
    throw new ApiError(400, "QR data is required");
  }

  // 1. Parse QR payload
  let parsed: any;
  try {
    parsed = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
  } catch (err) {
    throw new ApiError(400, "Invalid QR code format");
  }

  const studentId = parsed.studentId;
  const qrSchoolId = parsed.schoolId;

  if (!studentId) {
    throw new ApiError(400, "Student ID missing from QR code");
  }

  // 2. Validate school isolation (multi-tenancy check)
  if (qrSchoolId && qrSchoolId.toString() !== schoolId.toString()) {
    throw new ApiError(403, "This QR code belongs to a student from another school");
  }

  // 3. Find student in database
  const student = await Student.findOne({ _id: studentId, schoolId, deletedAt: null })
    .populate("userId", "name email profileImage")
    .lean();

  if (!student) {
    throw new ApiError(404, "Student not found in this school");
  }

  if (student.status !== "active") {
    throw new ApiError(400, `Student status is currently ${student.status}`);
  }

  // 4. Find active enrollment in current academic year
  const currentAcademicYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
  if (!currentAcademicYear) {
    throw new ApiError(400, "Active academic year not found");
  }

  const enrollment = await StudentEnrollment.findOne({
    schoolId,
    studentId: student._id,
    academicYearId: currentAcademicYear._id,
    studentEnrollmentStatus: "active"
  })
    .populate("classId", "name")
    .populate("sectionId", "name")
    .lean();

  if (!enrollment) {
    throw new ApiError(400, "Student has no active class enrollment for the current academic year");
  }

  const classId = (enrollment.classId as any)?._id?.toString() || (enrollment.classId as any)?.toString();
  const sectionId = (enrollment.sectionId as any)?._id?.toString() || (enrollment.sectionId as any)?.toString();
  const className = (enrollment.classId as any)?.name || "";
  const sectionName = (enrollment.sectionId as any)?.name || "";

  // 5. Check teacher authorization if scanner is teacher
  if (role === "teacher") {
    const isAuth = await isAuthorizedForAttendance(userId, role, classId, sectionId, schoolId);
    if (!isAuth) {
      throw new ApiError(
        403,
        `Student belongs to Class ${className} - Section ${sectionName}. You are not authorized to take attendance for this class.`
      );
    }
  }

  // 6. Record attendance for target date (default: today)
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const scanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let attendance = await Attendance.findOne({
    schoolId,
    classId,
    sectionId,
    date: startOfDay
  });

  let alreadyMarked = false;

  if (attendance) {
    const existingRecord = attendance.records.find(
      (r) => r.studentId.toString() === student._id.toString()
    );

    if (existingRecord) {
      if (existingRecord.status === "PRESENT") {
        alreadyMarked = true;
      } else {
        existingRecord.status = "PRESENT";
        existingRecord.remarks = `Scanned via QR at ${scanTime}`;
      }
    } else {
      attendance.records.push({
        studentId: student._id as any,
        status: "PRESENT",
        remarks: `Scanned via QR at ${scanTime}`
      });
    }

    attendance.takenBy = userId as any;
    await attendance.save();
  } else {
    // Attendance document doesn't exist yet for today: initialize all class students with ABSENT, and this student with PRESENT
    const allEnrollments = await StudentEnrollment.find({
      schoolId,
      classId,
      sectionId,
      academicYearId: currentAcademicYear._id,
      studentEnrollmentStatus: "active"
    }).sort({ rollNumber: 1 }).lean();

    const initialRecords = allEnrollments.map((env: any) => {
      const isThisStudent = env.studentId.toString() === student._id.toString();
      return {
        studentId: env.studentId,
        status: (isThisStudent ? "PRESENT" : "ABSENT") as "PRESENT" | "ABSENT",
        remarks: isThisStudent ? `Scanned via QR at ${scanTime}` : ""
      };
    });

    attendance = new Attendance({
      schoolId,
      academicYearId: currentAcademicYear._id,
      classId,
      sectionId,
      date: startOfDay,
      takenBy: userId as any,
      records: initialRecords
    });

    await attendance.save();
  }

  const studentUser = student.userId as any;
  const studentPhoto = studentUser?.profileImage || student.documents?.photoUrl || "";

  return {
    student: {
      _id: student._id.toString(),
      studentName: student.studentName,
      admissionNumber: student.admissionNumber,
      profileImage: studentPhoto,
      className,
      sectionName,
      rollNumber: enrollment.rollNumber,
      gender: student.gender,
      contact: student.contact || student.student_email || ""
    },
    attendance: {
      date: startOfDay,
      status: "PRESENT",
      scanTime,
      alreadyMarked
    },
    message: alreadyMarked
      ? `${student.studentName} is already marked Present for today.`
      : `Successfully marked ${student.studentName} Present!`
  };
};

export const getAttendanceAnalyticsService = async (
  schoolId: string,
  userId: string,
  role: string,
  classId?: string,
  sectionId?: string,
  academicYearId?: string,
  windowDays: number = 30,
  threshold: number = 75,
  riskFilter: string = 'ALL',
  isClassTeacherMode: boolean = false
) => {
  let targetYearId = academicYearId;
  if (!targetYearId) {
    const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
    if (!currentYear) throw new ApiError(400, "Active academic year not found");
    targetYearId = currentYear._id.toString();
  }

  let effectiveClassId = classId;
  let effectiveSectionId = sectionId;
  let assignedClassName = "";
  let assignedSectionName = "";

  // If request is from teacher or class teacher mode is active, auto-scope to teacher's assigned class
  if (role === 'teacher' || isClassTeacherMode) {
    const assignment = await getAssignedClassService(schoolId, userId, role);
    if (assignment.assigned) {
      effectiveClassId = assignment.classId;
      effectiveSectionId = assignment.sectionId;
      assignedClassName = assignment.className;
      assignedSectionName = assignment.sectionName;
    }
  }

  // 1. Fetch active enrollments matching criteria
  const queryFilter: any = {
    schoolId,
    academicYearId: targetYearId,
    studentEnrollmentStatus: "active"
  };
  if (effectiveClassId) queryFilter.classId = effectiveClassId;
  if (effectiveSectionId) queryFilter.sectionId = effectiveSectionId;

  const enrollments = await StudentEnrollment.find(queryFilter)
    .populate("studentId", "studentName admissionNumber contact gender profileImage")
    .populate("classId", "name")
    .populate("sectionId", "name")
    .sort({ rollNumber: 1 })
    .lean();

  if (enrollments.length === 0) {
    return {
      summary: {
        totalStudents: 0,
        criticalCount: 0,
        warningCount: 0,
        healthyCount: 0,
        activeStreaksCount: 0,
        average30DayRate: 100,
        assignedClassName,
        assignedSectionName
      },
      students: [],
      classTimeline: []
    };
  }

  // 2. Fetch historical attendance documents
  const attendanceDocsQuery: any = { schoolId, academicYearId: targetYearId };
  if (effectiveClassId) attendanceDocsQuery.classId = effectiveClassId;
  if (effectiveSectionId) attendanceDocsQuery.sectionId = effectiveSectionId;

  const attendanceDocs = await Attendance.find(attendanceDocsQuery)
    .sort({ date: 1 })
    .lean();

  // 3. Map attendance history by studentId
  const studentAttendanceMap = new Map<string, { date: Date; status: any; remarks?: string | undefined }[]>();
  
  attendanceDocs.forEach((doc) => {
    doc.records.forEach((rec) => {
      const sId = rec.studentId.toString();
      if (!studentAttendanceMap.has(sId)) {
        studentAttendanceMap.set(sId, []);
      }
      studentAttendanceMap.get(sId)!.push({
        date: doc.date,
        status: rec.status,
        remarks: rec.remarks
      });
    });
  });

  // 4. Run Sliding Window algorithm per student
  const minSampleDays = 7;
  let criticalCount = 0;
  let warningCount = 0;
  let healthyCount = 0;
  let activeStreaksCount = 0;

  const studentResults = enrollments.map((env: any) => {
    const student = env.studentId;
    const studentIdStr = student ? student._id.toString() : env._id.toString();
    const records = studentAttendanceMap.get(studentIdStr) || [];

    const analysis = analyzeStudentAttendance(studentIdStr, records, windowDays, threshold, minSampleDays);

    if (analysis.riskLevel === 'CRITICAL') criticalCount++;
    else if (analysis.riskLevel === 'WARNING') warningCount++;
    else healthyCount++;

    if (analysis.streakInfo.isStreakActive) activeStreaksCount++;

    return {
      ...analysis,
      studentName: student?.studentName || "Unknown Student",
      admissionNumber: student?.admissionNumber || "N/A",
      contact: student?.contact || "",
      gender: student?.gender || "",
      profileImage: student?.profileImage || "",
      className: env.classId?.name || "",
      sectionName: env.sectionId?.name || "",
      rollNumber: env.rollNumber,
    };
  });


  // 5. Filter by risk level if requested
  const filteredStudents = riskFilter === 'ALL'
    ? studentResults
    : studentResults.filter(s => s.riskLevel === riskFilter);

  // 6. Aggregate overall class rolling timeline curve
  const dateMap = new Map<string, { totalPresent: number; totalStudents: number }>();
  attendanceDocs.forEach((doc) => {
    const dateStr = new Date(doc.date).toISOString().split('T')[0]!;
    let presentInDoc = 0;
    doc.records.forEach((r) => {
      if (r.status === 'PRESENT' || r.status === 'LATE') presentInDoc += 1;
      else if (r.status === 'HALF_DAY') presentInDoc += 0.5;
    });
    const existing = dateMap.get(dateStr) || { totalPresent: 0, totalStudents: 0 };
    dateMap.set(dateStr, {
      totalPresent: existing.totalPresent + presentInDoc,
      totalStudents: existing.totalStudents + doc.records.length
    });
  });

  const sortedDates = Array.from(dateMap.keys()).sort();
  const totalDaysRecorded = sortedDates.length;
  const hasSufficientData = totalDaysRecorded >= minSampleDays;
  const warmupMessage = !hasSufficientData
    ? `Attendance tracking is in the warmup phase (${totalDaysRecorded} of ${minSampleDays} required days logged). Rolling 30-day percentage deficit alerts will be enabled after ${minSampleDays} days.`
    : undefined;

  const classTimeline = sortedDates.map((dateStr) => {
    const item = dateMap.get(dateStr)!;
    const dayRate = item.totalStudents > 0 ? Math.round((item.totalPresent / item.totalStudents) * 1000) / 10 : 100;
    return {
      date: dateStr,
      dayRate,
      threshold
    };
  });

  const stageAlerts = studentResults.flatMap(s => s.stageAlerts);

  return {
    summary: {
      totalStudents: studentResults.length,
      criticalCount,
      warningCount,
      healthyCount,
      activeStreaksCount,
      average30DayRate: studentResults.length > 0 
        ? Math.round((studentResults.reduce((acc, s) => acc + s.currentRolling30DayRate, 0) / studentResults.length) * 10) / 10 
        : 100,
      assignedClassName,
      assignedSectionName,
      stageAlertsCount: stageAlerts.length,
      totalDaysRecorded,
      minSampleDays,
      hasSufficientData,
      warmupMessage
    },
    stageAlerts,
    students: filteredStudents,
    classTimeline
  };
};


