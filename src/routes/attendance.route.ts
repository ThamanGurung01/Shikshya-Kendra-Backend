import { Router } from "express";
import {
  submitAttendance,
  getAttendance,
  getAssignedClass
} from "../controllers/attendance.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";

const attendanceRouter = Router();

// Endpoint for teacher to fetch their assigned class
attendanceRouter.get("/assigned-class", authenticate, authorize([Role.TEACHER]), getAssignedClass);

// Endpoints for submitting and fetching attendance records
attendanceRouter.post("/", authenticate, authorize([Role.OADMIN, Role.ADMIN, Role.TEACHER]), submitAttendance);
attendanceRouter.get("/", authenticate, authorize([Role.OADMIN, Role.ADMIN, Role.TEACHER]), getAttendance);

export default attendanceRouter;
