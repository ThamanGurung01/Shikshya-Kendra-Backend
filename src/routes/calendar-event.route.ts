import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent
} from "../controllers/calendar-event.controller";

const calendarEventRouter = Router();

const adminRoles = [Role.SUPERADMIN, Role.OADMIN, Role.ADMIN] as string[];
const allRoles = [Role.SUPERADMIN, Role.OADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.LIBRARIAN, Role.ACCOUNTANT] as string[];

calendarEventRouter.post("/events", authenticate, authorize(adminRoles), createEvent);
calendarEventRouter.get("/events", authenticate, authorize(allRoles), getEvents);
calendarEventRouter.put("/events/:id", authenticate, authorize(adminRoles), updateEvent);
calendarEventRouter.delete("/events/:id", authenticate, authorize(adminRoles), deleteEvent);

export default calendarEventRouter;
