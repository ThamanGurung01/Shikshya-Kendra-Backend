import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import { createClass, getAllClasses, getClassById, hardDeleteClass, updateClass } from '../controllers/class.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassInput:
 *       type: object
 *       required:
 *         - schoolId
 *         - name
 *       properties:
 *         schoolId:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c98
 *         name:
 *           type: string
 *           example: Grade 8
 *       example:
 *         schoolId: 680cf4d5e6e79f54ea8e8c98
 *         name: Grade 8
 *     Class:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         schoolId:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c98
 *         name:
 *           type: string
 *           example: Grade 8
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * /api/v1/class:
 *   post:
 *     summary: Create a class
 *     tags:
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *           example:
 *             schoolId: 680cf4d5e6e79f54ea8e8c98
 *             name: Grade 8
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all classes
 *     tags:
 *       - Class
 *     security:
 *       - bearerAuth: []
 *
 * /api/v1/class/{id}:
 *   get:
 *     summary: Get a class by id
 *     tags:
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8c99
 *   put:
 *     summary: Update a class
 *     tags:
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8c99
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *           example:
 *             schoolId: 680cf4d5e6e79f54ea8e8c98
 *             name: Grade 9
 *   delete:
 *     summary: Delete a class
 *     tags:
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8c99
 */
const classRouter = Router();

classRouter.post('/', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), createClass);
classRouter.get('/', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), getAllClasses);
classRouter.get('/:id', authenticate, getClassById);
classRouter.put('/:id', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), updateClass);
classRouter.delete('/:id', authenticate, authorize([Role.SUPERADMIN]), hardDeleteClass);

export default classRouter;