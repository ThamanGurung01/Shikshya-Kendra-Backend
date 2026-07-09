import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  autoGenerateRoutine,
  deleteClassTeacherAssignment,
  deleteRoutine,
  deleteSubjectTeacherMapping,
  getRoutine,
  getScheduleConfig,
  listClassTeacherAssignments,
  listSubjectTeacherMappings,
  saveClassTeacherAssignment,
  saveScheduleConfig,
  saveSubjectTeacherMapping,
  swapRoutineCells,
  updateBulkRoom,
  updateRoutineCell,
} from '../controllers/routine.controller';

const routineRouter = Router();

const routineRoles = [Role.OADMIN, Role.ADMIN] as string[];

routineRouter.post('/schedule-config', authenticate, authorize(routineRoles), saveScheduleConfig);
routineRouter.get('/schedule-config', authenticate, authorize(routineRoles), getScheduleConfig);

routineRouter.post('/subject-teacher-mappings', authenticate, authorize(routineRoles), saveSubjectTeacherMapping);
routineRouter.get('/subject-teacher-mappings', authenticate, authorize(routineRoles), listSubjectTeacherMappings);
routineRouter.delete('/subject-teacher-mappings/:id', authenticate, authorize(routineRoles), deleteSubjectTeacherMapping);

routineRouter.post('/class-teachers', authenticate, authorize(routineRoles), saveClassTeacherAssignment);
routineRouter.get('/class-teachers', authenticate, authorize(routineRoles), listClassTeacherAssignments);
routineRouter.delete('/class-teachers/:id', authenticate, authorize(routineRoles), deleteClassTeacherAssignment);

routineRouter.get('/routine', authenticate, authorize(routineRoles), getRoutine);
routineRouter.post('/routine/auto-generate', authenticate, authorize(routineRoles), autoGenerateRoutine);
routineRouter.delete('/routine/delete-routine', authenticate, authorize(routineRoles), deleteRoutine);
routineRouter.put('/routine/swap', authenticate, authorize(routineRoles), swapRoutineCells);
routineRouter.put('/routine/bulk-room', authenticate, authorize(routineRoles), updateBulkRoom);
routineRouter.put('/routine/:id', authenticate, authorize(routineRoles), updateRoutineCell);

export default routineRouter;