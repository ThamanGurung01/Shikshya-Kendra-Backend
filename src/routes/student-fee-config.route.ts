import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  saveStudentFeeConfig,
  getStudentFeeConfigs,
  getStudentFeeConfigByStudent,
} from "../controllers/student-fee-config.controller";

const studentFeeConfigRouter = Router();

studentFeeConfigRouter.get(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getStudentFeeConfigs
);

studentFeeConfigRouter.get(
  "/class/:classId",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getStudentFeeConfigs
);

studentFeeConfigRouter.get(
  "/student/:studentId",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT]),
  getStudentFeeConfigByStudent
);

studentFeeConfigRouter.post(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  saveStudentFeeConfig
);

export default studentFeeConfigRouter;
