import { Types } from "mongoose";
import { Assignment } from "../models/assignment.model";
import { AssignmentSubmission } from "../models/assignment-submission.model";
import { User } from "../models/user.model";
import { Teacher } from "../models/teacher.model";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { AcademicYear } from "../models/academic-year.model";
import { SubjectTeacherMapping } from "../models/subject-teacher-mapping.model";
import { ClassTeacherAssignment } from "../models/class-teacher-assignment.model";
import { SubjectModel } from "../models/subject.model";
import { notifyUserAssignmentUpdate } from "../configs/socket";

// Helper to get unread count
export const getStudentUnreadCount = async (schoolId: string, studentUserId: string): Promise<number> => {
  return await AssignmentSubmission.countDocuments({
    schoolId,
    studentId: studentUserId,
    isViewed: false,
  });
};

// Teacher Service Methods
export const getTeacherSectionsService = async (schoolId: string, teacherUserId: string) => {
  const teacherDoc = await Teacher.findOne({ userId: teacherUserId, schoolId }).lean();
  if (!teacherDoc) return [];

  const teacherId = teacherDoc._id;

  const mappings = await SubjectTeacherMapping.find({ schoolId, teacherId })
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .lean();

  const classTeacherAssignments = await ClassTeacherAssignment.find({ schoolId, teacherId })
    .populate("classId", "name")
    .populate("sectionId", "name")
    .lean();

  const result: any[] = [];
  const seenKeys = new Set<string>();

  const addMapping = (cls: any, sec: any, sub: any) => {
    if (!cls || !sec || !sub) return;
    const key = `${cls._id.toString()}-${sec._id.toString()}-${sub._id.toString()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      result.push({
        classId: { _id: cls._id, name: cls.name },
        sectionId: { _id: sec._id, name: sec.name },
        subjectId: { _id: sub._id, name: sub.name, code: sub.code },
      });
    }
  };

  // 1. Add mappings from SubjectTeacherMapping
  for (const m of mappings) {
    addMapping(m.classId, m.sectionId, m.subjectId);
  }

  // 2. Add mappings from ClassTeacherAssignment (fetch all subjects of that class)
  for (const cta of classTeacherAssignments) {
    if (!cta.classId || !cta.sectionId) continue;
    const subjects = await SubjectModel.find({ schoolId, classId: cta.classId._id || cta.classId }).lean();
    for (const sub of subjects) {
      addMapping(cta.classId, cta.sectionId, sub);
    }
  }

  return result;
};

export const createAssignmentService = async (
  schoolId: string,
  teacherUserId: string,
  payload: {
    classId: string;
    sectionId: string;
    subjectId: string;
    title: string;
    description: string;
    files: string[];
    dueDate: string;
  }
) => {
  // Find current/active academic year
  const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
  if (!currentYear) {
    const error: any = new Error("Active academic year not found");
    error.statusCode = 404;
    throw error;
  }

  // Find enrolled active students in this class/section
  const enrollments = (await StudentEnrollment.find({
    schoolId,
    classId: payload.classId,
    sectionId: payload.sectionId,
    studentEnrollmentStatus: "active",
    academicYearId: currentYear._id,
  }).populate("studentId").lean()) as any[];

  // Create Assignment
  const assignment = new Assignment({
    schoolId,
    teacherId: teacherUserId, // Store User ID of teacher
    classId: payload.classId,
    sectionId: payload.sectionId,
    subjectId: payload.subjectId,
    title: payload.title,
    description: payload.description,
    files: payload.files,
    dueDate: new Date(payload.dueDate),
  });

  const savedAssignment = await assignment.save();

  // Create submissions
  const submissions = enrollments
    .filter((enr: any) => enr.studentId && enr.studentId.userId)
    .map((enr: any) => ({
      schoolId,
      assignmentId: savedAssignment._id,
      studentId: enr.studentId.userId, // Store User ID of student
      status: "PENDING",
      isViewed: false,
      files: [],
      studentNote: null,
      feedback: null,
    }));

  if (submissions.length > 0) {
    await AssignmentSubmission.insertMany(submissions);
  }

  // Emit unread count to all students
  for (const enr of enrollments) {
    if (enr.studentId && enr.studentId.userId) {
      const studentUserIdStr = enr.studentId.userId.toString();
      const count = await getStudentUnreadCount(schoolId, studentUserIdStr);
      notifyUserAssignmentUpdate(studentUserIdStr, count);
    }
  }

  return savedAssignment;
};

export const getTeacherAssignmentsService = async (schoolId: string, teacherUserId: string) => {
  const assignments = await Assignment.find({ schoolId, teacherId: teacherUserId })
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .sort({ createdAt: -1 })
    .lean();

  const results = await Promise.all(
    assignments.map(async (assignment: any) => {
      const [totalStudents, completedCount] = await Promise.all([
        AssignmentSubmission.countDocuments({ schoolId, assignmentId: assignment._id }),
        AssignmentSubmission.countDocuments({ schoolId, assignmentId: assignment._id, status: "COMPLETED" }),
      ]);
      return {
        ...assignment,
        totalStudents,
        completedCount,
      };
    })
  );

  return results;
};

export const getTeacherAssignmentDetailService = async (
  schoolId: string,
  teacherUserId: string,
  assignmentId: string
) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, schoolId, teacherId: teacherUserId })
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name code")
    .lean();

  if (!assignment) {
    const error: any = new Error("Assignment not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  // Fetch submissions
  const submissions = await AssignmentSubmission.find({ schoolId, assignmentId })
    .populate("studentId", "name email profileImage")
    .lean();

  const studentUserIds = submissions.map((s: any) => s.studentId?._id || s.studentId);
  
  // Find Student documents to link User IDs to Student IDs
  const studentDocs = await Student.find({ userId: { $in: studentUserIds }, schoolId }).lean();
  const userIdToStudentMap = new Map(studentDocs.map((s: any) => [s.userId.toString(), s]));

  // Find StudentEnrollments to get roll numbers
  const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
  const studentIds = studentDocs.map((s: any) => s._id);

  const filterEnrollment: any = {
    schoolId,
    studentId: { $in: studentIds },
  };
  if (currentYear) {
    filterEnrollment.academicYearId = currentYear._id;
  }

  const enrollments = await StudentEnrollment.find(filterEnrollment).lean();
  const studentIdToRollMap = new Map(enrollments.map((e: any) => [e.studentId.toString(), e.rollNumber]));

  const submissionsWithDetails = submissions.map((s: any) => {
    const studentUserIdStr = (s.studentId?._id || s.studentId).toString();
    const studentDoc = userIdToStudentMap.get(studentUserIdStr);
    const studentIdStr = studentDoc?._id.toString();
    
    return {
      ...s,
      studentName: studentDoc?.studentName || s.studentId?.name || "Unknown",
      rollNumber: studentIdStr ? (studentIdToRollMap.get(studentIdStr) || null) : null,
    };
  });

  return {
    assignment,
    submissions: submissionsWithDetails,
  };
};

export const updateAssignmentService = async (
  schoolId: string,
  teacherUserId: string,
  assignmentId: string,
  payload: {
    title?: string | undefined;
    description?: string | undefined;
    files?: string[] | undefined;
    dueDate?: string | undefined;
  }
) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, schoolId, teacherId: teacherUserId });
  if (!assignment) {
    const error: any = new Error("Assignment not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  if (payload.title !== undefined) assignment.title = payload.title;
  if (payload.description !== undefined) assignment.description = payload.description;
  if (payload.files !== undefined) assignment.files = payload.files;
  if (payload.dueDate !== undefined) assignment.dueDate = new Date(payload.dueDate);

  return await assignment.save();
};

export const deleteAssignmentService = async (schoolId: string, teacherUserId: string, assignmentId: string) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, schoolId, teacherId: teacherUserId });
  if (!assignment) {
    const error: any = new Error("Assignment not found or unauthorized");
    error.statusCode = 404;
    throw error;
  }

  const submissions = await AssignmentSubmission.find({ schoolId, assignmentId }).lean();
  const studentIds = submissions.map((s: any) => s.studentId.toString());

  await AssignmentSubmission.deleteMany({ schoolId, assignmentId });
  await Assignment.deleteOne({ _id: assignmentId, schoolId, teacherId: teacherUserId });

  // Update and notify each student
  for (const sId of studentIds) {
    const count = await getStudentUnreadCount(schoolId, sId);
    notifyUserAssignmentUpdate(sId, count);
  }

  return { success: true };
};

export const reviewSubmissionService = async (
  schoolId: string,
  teacherUserId: string,
  submissionId: string,
  payload: {
    status: "COMPLETED" | "REDO";
    feedback?: string | undefined;
  }
) => {
  const submission = await AssignmentSubmission.findOne({ _id: submissionId, schoolId })
    .populate("assignmentId");

  if (!submission) {
    const error: any = new Error("Submission not found");
    error.statusCode = 404;
    throw error;
  }

  const assignment = submission.assignmentId as any;
  if (assignment.teacherId.toString() !== teacherUserId) {
    const error: any = new Error("Unauthorized to review this submission");
    error.statusCode = 403;
    throw error;
  }

  submission.status = payload.status;
  submission.feedback = payload.feedback || "";
  submission.isViewed = false; // alert student
  submission.checkedAt = new Date();

  const saved = await submission.save();

  // Notify student
  const studentIdStr = submission.studentId.toString();
  const count = await getStudentUnreadCount(schoolId, studentIdStr);
  notifyUserAssignmentUpdate(studentIdStr, count);

  return saved;
};

// Student Service Methods
export const getStudentAssignmentsService = async (schoolId: string, studentUserId: string, status?: string) => {
  const filter: any = { schoolId, studentId: studentUserId };
  if (status === "completed") {
    filter.status = "COMPLETED";
  } else if (status === "incomplete") {
    filter.status = { $in: ["PENDING", "SUBMITTED", "REDO"] };
  }

  return await AssignmentSubmission.find(filter)
    .populate({
      path: "assignmentId",
      populate: [
        { path: "teacherId", select: "name email profileImage" },
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();
};

export const getStudentAssignmentDetailService = async (
  schoolId: string,
  studentUserId: string,
  assignmentId: string
) => {
  const submission = await AssignmentSubmission.findOne({ schoolId, studentId: studentUserId, assignmentId })
    .populate({
      path: "assignmentId",
      populate: [
        { path: "teacherId", select: "name email profileImage" },
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    });

  if (!submission) {
    const error: any = new Error("Assignment submission not found");
    error.statusCode = 404;
    throw error;
  }

  if (!submission.isViewed) {
    submission.isViewed = true;
    await submission.save();

    // Notify update
    const count = await getStudentUnreadCount(schoolId, studentUserId);
    notifyUserAssignmentUpdate(studentUserId, count);
  }

  return submission;
};

export const submitAssignmentService = async (
  schoolId: string,
  studentUserId: string,
  assignmentId: string,
  payload: {
    studentNote?: string | undefined;
    files?: string[] | undefined;
  }
) => {
  const submission = await AssignmentSubmission.findOne({ schoolId, studentId: studentUserId, assignmentId });
  if (!submission) {
    const error: any = new Error("Submission not found");
    error.statusCode = 404;
    throw error;
  }

  if (submission.status === "COMPLETED") {
    const error: any = new Error("Cannot submit a completed assignment");
    error.statusCode = 400;
    throw error;
  }

  submission.files = payload.files || [];
  submission.studentNote = payload.studentNote || "";
  submission.status = "SUBMITTED";
  submission.submittedAt = new Date();
  submission.isViewed = true;

  const saved = await submission.save();

  // Notify student count update
  const count = await getStudentUnreadCount(schoolId, studentUserId);
  notifyUserAssignmentUpdate(studentUserId, count);

  return saved;
};

// Parent Service Methods
export const getParentChildAssignmentsService = async (
  schoolId: string,
  parentUserId: string,
  studentId: string // Can be Student ID or User ID
) => {
  const parent = await Parent.findOne({ userId: parentUserId }).lean();
  if (!parent) {
    const error: any = new Error("Parent not found");
    error.statusCode = 404;
    throw error;
  }

  const students = await Student.find({ parentId: parent._id, schoolId }).lean();
  const targetStudent = students.find(
    (std: any) => std._id.toString() === studentId || std.userId.toString() === studentId
  );

  if (!targetStudent) {
    const error: any = new Error("Access denied: student is not linked to your account");
    error.statusCode = 403;
    throw error;
  }

  const childUserId = targetStudent.userId;

  return await AssignmentSubmission.find({ schoolId, studentId: childUserId })
    .populate({
      path: "assignmentId",
      populate: [
        { path: "teacherId", select: "name email profileImage" },
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();
};

export const getParentChildAssignmentDetailService = async (
  schoolId: string,
  parentUserId: string,
  studentId: string,
  assignmentId: string
) => {
  const parent = await Parent.findOne({ userId: parentUserId }).lean();
  if (!parent) {
    const error: any = new Error("Parent not found");
    error.statusCode = 404;
    throw error;
  }

  const students = await Student.find({ parentId: parent._id, schoolId }).lean();
  const targetStudent = students.find(
    (std: any) => std._id.toString() === studentId || std.userId.toString() === studentId
  );

  if (!targetStudent) {
    const error: any = new Error("Access denied: student is not linked to your account");
    error.statusCode = 403;
    throw error;
  }

  const childUserId = targetStudent.userId;

  const submission = await AssignmentSubmission.findOne({ schoolId, studentId: childUserId, assignmentId })
    .populate({
      path: "assignmentId",
      populate: [
        { path: "teacherId", select: "name email profileImage" },
        { path: "subjectId", select: "name code" },
        { path: "classId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    });

  if (!submission) {
    const error: any = new Error("Assignment submission not found");
    error.statusCode = 404;
    throw error;
  }

  return submission;
};
