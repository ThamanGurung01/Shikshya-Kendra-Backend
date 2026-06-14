import { Router } from "express";
import { authenticate } from '../middlewares/auth.middleware';
import { createParent, getAllParents, getParentById, updateParent, hardDeleteParent } from '../controllers/parent.controller';
import Role from "../utils/role.util";
import { authorize } from "../middlewares/role.middleware";

const parentRouter = Router();
parentRouter.post('/', authenticate, authorize([Role.OADMIN]), createParent);
parentRouter.get('/', authenticate, authorize([Role.OADMIN]), getAllParents);
parentRouter.get('/:id', authenticate, authorize([Role.OADMIN]), getParentById);
parentRouter.put('/:id', authenticate, authorize([Role.OADMIN]), updateParent);
parentRouter.delete('/:id', authenticate, authorize([Role.OADMIN]), hardDeleteParent);
export default parentRouter;
