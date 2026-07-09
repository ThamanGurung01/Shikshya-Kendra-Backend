import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import { createSubject, getAllSubjects, getSubjectById, hardDeleteSubject, updateSubject } from '../controllers/subject.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     SubjectInput:
 *       type: object
 *       required:
 *         - classId
 *         - name
 *         - code
 *       properties:
 *         schoolId:
 *           type: string
 *           description: School ID (optional). Resolved from authenticated user context when omitted.
 *         classId:
 *           type: string
 *           description: Class ID to associate this subject with.
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         name:
 *           type: string
 *           example: Mathematics
 *         code:
 *           type: string
 *           example: MATH
 *       example:
 *         classId: 680cf4d5e6e79f54ea8e8c99
 *         name: Mathematics
 *         code: MATH
 *     Subject:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           readOnly: true
 *         schoolId:
 *           type: string
 *           description: School ID (injected by server)
 *           readOnly: true
 *         classId:
 *           type: string
 *           description: Associated class ID
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *     SubjectResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Subject retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Subject'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Subject'
 *     SubjectCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Subject created successfully
 *         data:
 *           $ref: '#/components/schemas/Subject'
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
 *           example: Subject permanently deleted successfully
 *
 * /api/v1/subject:
 *   post:
 *     summary: Create a subject
 *     tags:
 *       - Subject
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectInput'
 *           example:
 *             classId: 680cf4d5e6e79f54ea8e8c99
 *             name: Mathematics
 *             code: MATH
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectCreateResponse'
 *       400:
 *         description: Request failed (validation, unauthorized, or forbidden)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all subjects
 *     tags:
 *       - Subject
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectResponse'
 *       400:
 *         description: Request failed (unauthorized or forbidden)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/subject/{id}:
 *   get:
 *     summary: Get a subject by id
 *     tags:
 *       - Subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8ca1
 *     responses:
 *       200:
 *         description: Subject retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectResponse'
 *       400:
 *         description: Request failed (invalid ID, unauthorized, or not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update a subject
 *     tags:
 *       - Subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8ca1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectInput'
 *           example:
 *             classId: 680cf4d5e6e79f54ea8e8c99
 *             name: English
 *             code: ENG
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectResponse'
 *       400:
 *         description: Request failed (validation, unauthorized, forbidden, or not found)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a subject
 *     tags:
 *       - Subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8ca1
 *     responses:
 *       200:
 *         description: Subject permanently deleted successfully
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
const subjectRouter = Router();

subjectRouter.post('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), createSubject);
subjectRouter.get('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getAllSubjects);
subjectRouter.get('/:id', authenticate, getSubjectById);
subjectRouter.put('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateSubject);
subjectRouter.delete('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), hardDeleteSubject);

export default subjectRouter;