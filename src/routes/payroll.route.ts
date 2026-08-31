import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  saveSalaryConfig,
  getSalaryConfigs,
  deleteSalaryConfig,
  generateBatchPayroll,
  getPayrolls,
  disburseSalary,
} from "../controllers/payroll.controller";

const payrollRouter = Router();

payrollRouter.get(
  "/salary-configs",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getSalaryConfigs
);

payrollRouter.post(
  "/salary-configs",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  saveSalaryConfig
);

payrollRouter.delete(
  "/salary-configs/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  deleteSalaryConfig
);

payrollRouter.post(
  "/generate-batch",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  generateBatchPayroll
);

payrollRouter.get(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getPayrolls
);

payrollRouter.post(
  "/:id/disburse",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  disburseSalary
);

export default payrollRouter;
