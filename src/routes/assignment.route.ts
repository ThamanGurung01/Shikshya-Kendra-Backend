import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  getTeacherAssignedSections,
  createAssignment,
  getTeacherAssignments,
  getTeacherAssignmentDetail,
  updateAssignment,
  deleteAssignment,
  reviewSubmission,
  getStudentAssignments,
  getStudentUnreadCountController,
  getStudentAssignmentDetail,
  submitAssignment,
  getParentChildAssignments,
  getParentChildAssignmentDetail,
} from "../controllers/assignment.controller";

const assignmentRouter = Router();

// Apply authenticate globally to all assignment routes
assignmentRouter.use(authenticate as any);

// --- Teacher Routes ---
assignmentRouter.get("/teacher/sections", authorize([Role.TEACHER]), getTeacherAssignedSections);
assignmentRouter.post("/teacher", authorize([Role.TEACHER]), createAssignment);
assignmentRouter.get("/teacher", authorize([Role.TEACHER]), getTeacherAssignments);
assignmentRouter.get("/teacher/:id", authorize([Role.TEACHER]), getTeacherAssignmentDetail);
assignmentRouter.patch("/teacher/:id", authorize([Role.TEACHER]), updateAssignment);
assignmentRouter.delete("/teacher/:id", authorize([Role.TEACHER]), deleteAssignment);
assignmentRouter.patch("/teacher/submissions/:submissionId/review", authorize([Role.TEACHER]), reviewSubmission);

// --- Student Routes ---
assignmentRouter.get("/student/unread-count", authorize([Role.STUDENT]), getStudentUnreadCountController);
assignmentRouter.get("/student", authorize([Role.STUDENT]), getStudentAssignments);
assignmentRouter.get("/student/:id", authorize([Role.STUDENT]), getStudentAssignmentDetail);
assignmentRouter.post("/student/:id/submit", authorize([Role.STUDENT]), submitAssignment);

// --- Parent Routes ---
assignmentRouter.get("/parent", authorize([Role.PARENT]), getParentChildAssignments);
assignmentRouter.get("/parent/:id", authorize([Role.PARENT]), getParentChildAssignmentDetail);

export default assignmentRouter;
