import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
} from "../controllers/announcement.controller";

const announcementRouter = Router();

const teacherOrAdminRoles = [Role.SUPERADMIN, Role.OADMIN, Role.ADMIN, Role.TEACHER] as string[];
const allRoles = [Role.SUPERADMIN, Role.OADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.LIBRARIAN, Role.ACCOUNTANT] as string[];

announcementRouter.post("/", authenticate, authorize(teacherOrAdminRoles), createAnnouncement);
announcementRouter.get("/", authenticate, authorize(allRoles), getAnnouncements);
announcementRouter.put("/:id", authenticate, authorize(teacherOrAdminRoles), updateAnnouncement);
announcementRouter.delete("/:id", authenticate, authorize(teacherOrAdminRoles), deleteAnnouncement);
announcementRouter.patch("/read-all", authenticate, authorize(allRoles), markAllAnnouncementsAsRead);
announcementRouter.patch("/:id/read", authenticate, authorize(allRoles), markAnnouncementAsRead);

export default announcementRouter;
