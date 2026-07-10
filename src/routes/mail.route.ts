import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  sendMail,
  getInbox,
  getSent,
  getMailById,
  markAllAsRead,
  deleteMail,
  getRecipientMeta,
  searchRecipients,
  getUnreadMailCount,
} from '../controllers/mail.controller';

const mailRouter = Router();

// All mail routes require authentication + school context (not superadmin)
const allSchoolRoles = [
  Role.OADMIN,
  Role.ADMIN,
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
  Role.LIBRARIAN,
  Role.ACCOUNTANT,
] as string[];

mailRouter.post('/send', authenticate, authorize(allSchoolRoles), sendMail);
mailRouter.get('/inbox', authenticate, authorize(allSchoolRoles), getInbox);
mailRouter.get('/sent', authenticate, authorize(allSchoolRoles), getSent);
mailRouter.get('/unread-count', authenticate, authorize(allSchoolRoles), getUnreadMailCount);
mailRouter.get('/recipients/meta', authenticate, authorize(allSchoolRoles), getRecipientMeta);
mailRouter.get('/recipients/search', authenticate, authorize(allSchoolRoles), searchRecipients);
mailRouter.patch('/mark-all-read', authenticate, authorize(allSchoolRoles), markAllAsRead);
mailRouter.get('/:id', authenticate, authorize(allSchoolRoles), getMailById);
mailRouter.delete('/:id', authenticate, authorize(allSchoolRoles), deleteMail);

export default mailRouter;
