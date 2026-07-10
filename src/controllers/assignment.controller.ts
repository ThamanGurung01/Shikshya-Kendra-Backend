import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { sendSuccess, sendError } from "../utils/response.util";
import { zodError } from "../utils/zod-error.util";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  reviewSubmissionSchema,
  studentSubmitSchema,
} from "../validators/assignment.validator";
import {
  getTeacherSectionsService,
  createAssignmentService,
  getTeacherAssignmentsService,
  getTeacherAssignmentDetailService,
  updateAssignmentService,
  deleteAssignmentService,
  reviewSubmissionService,
  getStudentAssignmentsService,
  getStudentAssignmentDetailService,
  submitAssignmentService,
  getParentChildAssignmentsService,
  getParentChildAssignmentDetailService,
  getStudentUnreadCount,
} from "../services/assignment.service";

// --- TEACHER CONTROLLERS ---

export const getTeacherAssignedSections = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const teacherId = req.userId;
    const schoolId = req.schoolId;
    if (!teacherId || !schoolId || req.role !== "teacher") {
      return sendError(res, "Access denied: Teachers only", undefined, 403);
    }

    const data = await getTeacherSectionsService(schoolId, teacherId);
    return sendSuccess(res, "Assigned sections retrieved successfully", data, 200);
  } catch (error: any) {
    console.error("getTeacherAssignedSections error:", error);
    return sendError(res, error.message || "Failed to retrieve assigned sections", undefined, error.statusCode || 500);
  }
};

export const createAssignment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const teacherId = req.userId;
    const schoolId = req.schoolId;
    if (!teacherId || !schoolId || req.role !== "teacher") {
      return sendError(res, "Access denied: Teachers only", undefined, 403);
    }

    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const data = await createAssignmentService(schoolId, teacherId, parsed.data);
    return sendSuccess(res, "Assignment created successfully", data, 201);
  } catch (error: any) {
    console.error("createAssignment error:", error);
    return sendError(res, error.message || "Failed to create assignment", undefined, error.statusCode || 500);
  }
};

export const getTeacherAssignments = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const teacherId = req.userId;
    const schoolId = req.schoolId;
    if (!teacherId || !schoolId || req.role !== "teacher") {
      return sendError(res, "Access denied: Teachers only", undefined, 403);
    }

    const data = await getTeacherAssignmentsService(schoolId, teacherId);
    return sendSuccess(res, "Assignments retrieved successfully", data, 200);
  } catch (error: any) {
    console.error("getTeacherAssignments error:", error);
    return sendError(res, error.message || "Failed to retrieve assignments", undefined, error.statusCode || 500);
  }
};

export const getTeacherAssignmentDetail = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const teacherId = req.userId;
    const schoolId = req.schoolId;
    const assignmentId = req.params.id as string;

    if (!teacherId || !schoolId || req.role !== "teacher") {
      return sendError(res, "Access denied: Teachers only", undefined, 403);
    }

    const data = await getTeacherAssignmentDetailService(schoolId, teacherId, assignmentId);
    return sendSuccess(res, "Assignment details retrieved successfully", data, 200);
  } catch (error: any) {
    console.error("getTeacherAssignmentDetail error:", error);
    return sendError(res, error.message || "Failed to retrieve assignment details", undefined, error.statusCode || 500);
  }
};

export const updateAssignment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const teacherId = req.userId;
    const schoolId = req.schoolId;
    const assignmentId = req.params.id as string;

    if (!teacherId || !schoolId || req.role !== "teacher") {
      return sendError(res, "Access denied: Teachers only", undefined, 403);
    }

    const parsed = updateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const data = await updateAssignmentService(schoolId, teacherId, assignmentId, parsed.data);
    return sendSuccess(res, "Assignment updated successfully", data, 200);
  } catch (error: any) {
    console.error("updateAssignment error:", error);
    return sendError(res, error.message || "Failed to update assignment", undefined, error.statusCode || 500);
  }
};

export const deleteAssignment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const teacherId = req.userId;
    const schoolId = req.schoolId;
    const assignmentId = req.params.id as string;

    if (!teacherId || !schoolId || req.role !== "teacher") {
      return sendError(res, "Access denied: Teachers only", undefined, 403);
    }

    await deleteAssignmentService(schoolId, teacherId, assignmentId);
    return sendSuccess(res, "Assignment deleted successfully", undefined, 200);
  } catch (error: any) {
    console.error("deleteAssignment error:", error);
    return sendError(res, error.message || "Failed to delete assignment", undefined, error.statusCode || 500);
  }
};

export const reviewSubmission = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const teacherId = req.userId;
    const schoolId = req.schoolId;
    const submissionId = req.params.submissionId as string;

    if (!teacherId || !schoolId || req.role !== "teacher") {
      return sendError(res, "Access denied: Teachers only", undefined, 403);
    }

    const parsed = reviewSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const data = await reviewSubmissionService(schoolId, teacherId, submissionId, parsed.data);
    return sendSuccess(res, "Submission reviewed successfully", data, 200);
  } catch (error: any) {
    console.error("reviewSubmission error:", error);
    return sendError(res, error.message || "Failed to review submission", undefined, error.statusCode || 500);
  }
};

// --- STUDENT CONTROLLERS ---

export const getStudentAssignments = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const studentId = req.userId;
    const schoolId = req.schoolId;
    const status = req.query.status as string;

    if (!studentId || !schoolId || req.role !== "student") {
      return sendError(res, "Access denied: Students only", undefined, 403);
    }

    const data = await getStudentAssignmentsService(schoolId, studentId, status);
    return sendSuccess(res, "Student assignments retrieved successfully", data, 200);
  } catch (error: any) {
    console.error("getStudentAssignments error:", error);
    return sendError(res, error.message || "Failed to retrieve student assignments", undefined, error.statusCode || 500);
  }
};

export const getStudentUnreadCountController = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const studentId = req.userId;
    const schoolId = req.schoolId;

    if (!studentId || !schoolId || req.role !== "student") {
      return sendError(res, "Access denied: Students only", undefined, 403);
    }

    const count = await getStudentUnreadCount(schoolId, studentId);
    return sendSuccess(res, "Unread count retrieved successfully", { count }, 200);
  } catch (error: any) {
    console.error("getStudentUnreadCountController error:", error);
    return sendError(res, error.message || "Failed to get unread assignments count", undefined, error.statusCode || 500);
  }
};

export const getStudentAssignmentDetail = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const studentId = req.userId;
    const schoolId = req.schoolId;
    const assignmentId = req.params.id as string;

    if (!studentId || !schoolId || req.role !== "student") {
      return sendError(res, "Access denied: Students only", undefined, 403);
    }

    const data = await getStudentAssignmentDetailService(schoolId, studentId, assignmentId);
    return sendSuccess(res, "Assignment detail retrieved successfully", data, 200);
  } catch (error: any) {
    console.error("getStudentAssignmentDetail error:", error);
    return sendError(res, error.message || "Failed to retrieve assignment detail", undefined, error.statusCode || 500);
  }
};

export const submitAssignment = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const studentId = req.userId;
    const schoolId = req.schoolId;
    const assignmentId = req.params.id as string;

    if (!studentId || !schoolId || req.role !== "student") {
      return sendError(res, "Access denied: Students only", undefined, 403);
    }

    const parsed = studentSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Validation failed", zodError(parsed.error), 400);
    }

    const data = await submitAssignmentService(schoolId, studentId, assignmentId, parsed.data);
    return sendSuccess(res, "Assignment submitted successfully", data, 200);
  } catch (error: any) {
    console.error("submitAssignment error:", error);
    return sendError(res, error.message || "Failed to submit assignment", undefined, error.statusCode || 500);
  }
};

// --- PARENT CONTROLLERS ---

export const getParentChildAssignments = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const parentId = req.userId;
    const schoolId = req.schoolId;
    const studentId = req.query.studentId as string;

    if (!parentId || !schoolId || req.role !== "parent") {
      return sendError(res, "Access denied: Parents only", undefined, 403);
    }

    if (!studentId) {
      return sendError(res, "studentId query parameter is required", undefined, 400);
    }

    const data = await getParentChildAssignmentsService(schoolId, parentId, studentId);
    return sendSuccess(res, "Child assignments retrieved successfully", data, 200);
  } catch (error: any) {
    console.error("getParentChildAssignments error:", error);
    return sendError(res, error.message || "Failed to retrieve child assignments", undefined, error.statusCode || 500);
  }
};

export const getParentChildAssignmentDetail = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const parentId = req.userId;
    const schoolId = req.schoolId;
    const studentId = req.query.studentId as string;
    const assignmentId = req.params.id as string;

    if (!parentId || !schoolId || req.role !== "parent") {
      return sendError(res, "Access denied: Parents only", undefined, 403);
    }

    if (!studentId) {
      return sendError(res, "studentId query parameter is required", undefined, 400);
    }

    const data = await getParentChildAssignmentDetailService(schoolId, parentId, studentId, assignmentId);
    return sendSuccess(res, "Child assignment detail retrieved successfully", data, 200);
  } catch (error: any) {
    console.error("getParentChildAssignmentDetail error:", error);
    return sendError(res, error.message || "Failed to retrieve child assignment detail", undefined, error.statusCode || 500);
  }
};
