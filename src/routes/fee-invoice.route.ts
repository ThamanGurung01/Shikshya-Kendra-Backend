import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  getClassStudentsFeeSummary,
  getStudentDueSummary,
  getStudentFeeDetailsAndHistory,
  collectFeePayment,
  getInvoices,
  getInvoiceById,
  getMyInvoices,
  getMyDueSummary,
} from "../controllers/fee-invoice.controller";

const feeInvoiceRouter = Router();

feeInvoiceRouter.get(
  "/class-summary",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getClassStudentsFeeSummary
);

feeInvoiceRouter.get(
  "/student/:studentId/due-summary",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT]),
  getStudentDueSummary
);

feeInvoiceRouter.get(
  "/student/:studentId/history",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT]),
  getStudentFeeDetailsAndHistory
);

feeInvoiceRouter.post(
  "/collect-payment",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  collectFeePayment
);

feeInvoiceRouter.get(
  "/my-receipts",
  authenticate,
  authorize([Role.STUDENT, Role.PARENT]),
  getMyInvoices
);

feeInvoiceRouter.get(
  "/my-due-summary",
  authenticate,
  authorize([Role.STUDENT, Role.PARENT]),
  getMyDueSummary
);

feeInvoiceRouter.get(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getInvoices
);

feeInvoiceRouter.get(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT]),
  getInvoiceById
);

export default feeInvoiceRouter;
