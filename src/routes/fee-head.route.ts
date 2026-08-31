import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  createFeeHead,
  getFeeHeads,
  getFeeHeadById,
  updateFeeHead,
  deleteFeeHead,
} from "../controllers/fee-head.controller";

const feeHeadRouter = Router();

feeHeadRouter.get(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT, Role.STUDENT, Role.PARENT]),
  getFeeHeads
);

feeHeadRouter.post(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  createFeeHead
);

feeHeadRouter.get(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getFeeHeadById
);

feeHeadRouter.put(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  updateFeeHead
);

feeHeadRouter.delete(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  deleteFeeHead
);

export default feeHeadRouter;
