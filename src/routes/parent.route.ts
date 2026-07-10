import { Router } from "express";
import { authenticate } from '../middlewares/auth.middleware';
import { createParent, getAllParents, getParentById, updateParent, hardDeleteParent, getParentChildren } from '../controllers/parent.controller';
import Role from "../utils/role.util";
import { authorize } from "../middlewares/role.middleware";

const parentRouter = Router();
parentRouter.post('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), createParent);
parentRouter.get('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getAllParents);
parentRouter.get('/children', authenticate, authorize([Role.PARENT]), getParentChildren);
parentRouter.get('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getParentById);
parentRouter.put('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateParent);
parentRouter.delete('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), hardDeleteParent);
export default parentRouter;
