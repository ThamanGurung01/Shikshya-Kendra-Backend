import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  getMyGradeAssignments,
  getGradeAssignmentDetail,
  updateGradeEntries,
  finalizeGradeAssignment,
  reopenGradeAssignment,
  getAssignmentHistory,
} from '../controllers/grade-assignment.controller';

const gradeAssignmentRouter = Router();

// --- Teacher Routes ---
gradeAssignmentRouter.get(
  '/my',
  authenticate,
  authorize([Role.TEACHER]),
  getMyGradeAssignments,
);

gradeAssignmentRouter.get(
  '/:id',
  authenticate,
  authorize([Role.TEACHER, Role.OADMIN, Role.ADMIN]),
  getGradeAssignmentDetail,
);

gradeAssignmentRouter.patch(
  '/:id/entries',
  authenticate,
  authorize([Role.TEACHER]),
  updateGradeEntries,
);

gradeAssignmentRouter.post(
  '/:id/finalize',
  authenticate,
  authorize([Role.TEACHER]),
  finalizeGradeAssignment,
);

// --- Admin Routes ---
gradeAssignmentRouter.post(
  '/:id/reopen',
  authenticate,
  authorize([Role.OADMIN, Role.ADMIN]),
  reopenGradeAssignment,
);

gradeAssignmentRouter.get(
  '/:id/history',
  authenticate,
  authorize([Role.OADMIN, Role.ADMIN, Role.TEACHER]),
  getAssignmentHistory,
);

export default gradeAssignmentRouter;
