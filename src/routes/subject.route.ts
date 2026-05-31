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
 *         - schoolId
 *         - name
 *         - code
 *       properties:
 *         schoolId:
 *           type: string
 *         name:
 *           type: string
 *           example: Mathematics
 *         code:
 *           type: string
 *           example: MATH
 *       example:
 *         schoolId: 680cf4d5e6e79f54ea8e8c98
 *         name: Mathematics
 *         code: MATH
 *     Subject:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         schoolId:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
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
 *             schoolId: 680cf4d5e6e79f54ea8e8c98
 *             name: Mathematics
 *             code: MATH
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all subjects
 *     tags:
 *       - Subject
 *     security:
 *       - bearerAuth: []
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
 *             schoolId: 680cf4d5e6e79f54ea8e8c98
 *             name: English
 *             code: ENG
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
 */
const subjectRouter = Router();

subjectRouter.post('/', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), createSubject);
subjectRouter.get('/', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), getAllSubjects);
subjectRouter.get('/:id', authenticate, getSubjectById);
subjectRouter.put('/:id', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), updateSubject);
subjectRouter.delete('/:id', authenticate, authorize([Role.SUPERADMIN]), hardDeleteSubject);

export default subjectRouter;