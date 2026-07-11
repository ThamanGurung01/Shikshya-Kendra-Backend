import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  getExamRoutine,
  updateExamRoutineCell,
  createExamRoutineCell,
  deleteExamRoutineCell,
  getMyExams,
  getMyExamRoutine,
} from '../controllers/exam.controller';

const examRouter = Router();

// Teacher, Parent, Student Routes
examRouter.get('/my-exams', authenticate, authorize([Role.TEACHER, Role.STUDENT, Role.PARENT]), getMyExams);
examRouter.get('/my-routine', authenticate, authorize([Role.TEACHER, Role.STUDENT, Role.PARENT]), getMyExamRoutine);

// Exam Routes
examRouter.post('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), createExam);
examRouter.get('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getAllExams);
examRouter.get('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getExamById);
examRouter.put('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateExam);
examRouter.delete('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), deleteExam);

// Exam Routine Routes
examRouter.get('/routine/list', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getExamRoutine);
examRouter.post('/routine', authenticate, authorize([Role.OADMIN, Role.ADMIN]), createExamRoutineCell);
examRouter.put('/routine/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateExamRoutineCell);
examRouter.delete('/routine/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), deleteExamRoutineCell);

export default examRouter;
