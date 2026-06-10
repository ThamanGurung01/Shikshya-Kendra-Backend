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
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Grade 8
 *       example:
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
 *         sectionCount:
 *           type: integer
 *           example: 3
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ClassResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Class retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Class'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Class'
 *     ClassCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Class created successfully
 *         data:
 *           $ref: '#/components/schemas/Class'
 *     ValidationErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Validation failed
 *         errors:
 *           type: object
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Unauthorized
 *     MessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Class permanently deleted successfully
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
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassCreateResponse'
 *       400:
 *         description: Request failed (validation, unauthorized, or forbidden)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all classes
 *     tags:
 *       - Class
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Classes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassResponse'
 *       400:
 *         description: Request failed (unauthorized or forbidden)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *     responses:
 *       200:
 *         description: Class retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassResponse'
 *       400:
 *         description: Request failed (invalid ID, unauthorized, or not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassResponse'
 *       400:
 *         description: Request failed (validation, unauthorized, forbidden, or not found)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
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
 *     responses:
 *       200:
 *         description: Class permanently deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Request failed (invalid ID, unauthorized, forbidden, or not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const classRouter = Router();

classRouter.post('/', authenticate, authorize([Role.OADMIN]), createClass);
classRouter.get('/', authenticate, authorize([Role.OADMIN]), getAllClasses);
classRouter.get('/:id', authenticate, getClassById);
classRouter.put('/:id', authenticate, authorize([Role.OADMIN]), updateClass);
classRouter.delete('/:id', authenticate, authorize([Role.OADMIN]), hardDeleteClass);

export default classRouter;