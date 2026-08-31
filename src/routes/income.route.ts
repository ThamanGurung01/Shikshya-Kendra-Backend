import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
} from "../controllers/income.controller";

const incomeRouter = Router();

incomeRouter.get(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getIncomes
);

incomeRouter.post(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  createIncome
);

incomeRouter.get(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getIncomeById
);

incomeRouter.put(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  updateIncome
);

incomeRouter.delete(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  deleteIncome
);

export default incomeRouter;
