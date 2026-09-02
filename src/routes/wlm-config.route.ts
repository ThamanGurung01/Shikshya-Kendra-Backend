import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import { getWlmConfig, updateWlmConfig } from '../controllers/wlm.controller';

const wlmConfigRouter = Router();

wlmConfigRouter.get('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getWlmConfig);
wlmConfigRouter.put('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateWlmConfig);

export default wlmConfigRouter;
