import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import { getDashboardStats, resetPrincipalPassword } from '../controllers/superadmin.controller';

const superadminRouter = Router();

superadminRouter.get('/dashboard-stats', authenticate, authorize([Role.SUPERADMIN]), getDashboardStats);
superadminRouter.post('/reset-principal-password', authenticate, authorize([Role.SUPERADMIN]), resetPrincipalPassword);

export default superadminRouter;
