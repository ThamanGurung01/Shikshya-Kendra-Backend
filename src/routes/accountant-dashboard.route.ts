import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  getDashboardMetrics,
  getDashboardCharts,
  getFinancialStatementReport,
  getFinancialForecast,
} from "../controllers/accountant-dashboard.controller";

const accountantDashboardRouter = Router();

accountantDashboardRouter.get(
  "/metrics",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getDashboardMetrics
);

accountantDashboardRouter.get(
  "/charts",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getDashboardCharts
);

accountantDashboardRouter.get(
  "/financial-statement",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getFinancialStatementReport
);

accountantDashboardRouter.get(
  "/forecast",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getFinancialForecast
);

export default accountantDashboardRouter;

