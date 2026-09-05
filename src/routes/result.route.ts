import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  createResult,
  getAllResults,
  getResultById,
  updateResultStatus,
  deleteResult,
  getResultGradeAssignments,
  getResultHistory,
  getStudentGradeHistory,
  reopenGradeAssignment,
  reassignGradeAssignmentTeacher,
  getMyResults,
  getMyResultDetails,
  getStudentResultsForAdmin,
  getStudentResultDetailsForAdmin,
} from '../controllers/result.controller';
import { getWlmScores, recalculateWlm, getAnnualPerformance, getClassRankings } from '../controllers/wlm.controller';

const resultRouter = Router();

// --- Class Rankings Leaderboard View (Admin & Teacher) ---
resultRouter.get('/class-rankings', authenticate, authorize([Role.OADMIN, Role.ADMIN, Role.TEACHER]), getClassRankings);

// --- Result CRUD (Admin only) ---
resultRouter.post('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), createResult);
resultRouter.get('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getAllResults);
resultRouter.get('/history/student/:studentId', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getStudentGradeHistory);
// --- Student/Parent Result Views ---
resultRouter.get('/my-results', authenticate, authorize([Role.STUDENT, Role.PARENT]), getMyResults);
resultRouter.get('/my-results/:resultId', authenticate, authorize([Role.STUDENT, Role.PARENT]), getMyResultDetails);

// --- Admin-specific Student Result Views ---
resultRouter.get('/admin/student/:studentId/results', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getStudentResultsForAdmin);
resultRouter.get('/admin/student/:studentId/results/:resultId', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getStudentResultDetailsForAdmin);
resultRouter.get('/student/:studentId/annual-wlm', authenticate, authorize([Role.OADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT]), getAnnualPerformance);


resultRouter.get('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getResultById);
resultRouter.patch('/:id/status', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateResultStatus);
resultRouter.delete('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), deleteResult);

// --- Grade Assignments for a Result ---
resultRouter.get('/:id/grade-assignments', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getResultGradeAssignments);
resultRouter.post('/:id/grade-assignments/:gaId/reopen', authenticate, authorize([Role.OADMIN, Role.ADMIN]), reopenGradeAssignment);
resultRouter.patch('/:id/grade-assignments/:gaId/reassign', authenticate, authorize([Role.OADMIN, Role.ADMIN]), reassignGradeAssignmentTeacher);

// --- Grade History for a Result ---
resultRouter.get('/:id/history', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getResultHistory);

// --- WLM Scores for a Result ---
resultRouter.get('/:id/wlm-scores', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getWlmScores);
resultRouter.post('/:id/recalculate-wlm', authenticate, authorize([Role.OADMIN, Role.ADMIN]), recalculateWlm);

export default resultRouter;

