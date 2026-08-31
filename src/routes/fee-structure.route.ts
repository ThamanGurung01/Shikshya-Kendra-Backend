import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  saveFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  deleteFeeStructure,
} from "../controllers/fee-structure.controller";

const feeStructureRouter = Router();

feeStructureRouter.get(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getFeeStructures
);

feeStructureRouter.post(
  "/",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  saveFeeStructure
);

feeStructureRouter.get(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  getFeeStructureById
);

feeStructureRouter.delete(
  "/:id",
  authenticate,
  authorize([Role.ADMIN, Role.OADMIN, Role.ACCOUNTANT]),
  deleteFeeStructure
);

export default feeStructureRouter;
