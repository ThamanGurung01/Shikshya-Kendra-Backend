import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import { createSection, getAllSections, getSectionById, hardDeleteSection, updateSection } from '../controllers/section.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     SectionInput:
 *       type: object
 *       required:
 *         - schoolId
 *         - classId
 *         - name
 *       properties:
 *         schoolId:
 *           type: string
 *         classId:
 *           type: string
 *         name:
 *           type: string
 *           example: A
 *       example:
 *         schoolId: 680cf4d5e6e79f54ea8e8c98
 *         classId: 680cf4d5e6e79f54ea8e8c99
 *         name: A
 *     Section:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         schoolId:
 *           type: string
 *         classId:
 *           type: string
 *         name:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * /api/v1/section:
 *   post:
 *     summary: Create a section
 *     tags:
 *       - Section
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionInput'
 *           example:
 *             schoolId: 680cf4d5e6e79f54ea8e8c98
 *             classId: 680cf4d5e6e79f54ea8e8c99
 *             name: A
 *     responses:
 *       201:
 *         description: Section created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get all sections
 *     tags:
 *       - Section
 *     security:
 *       - bearerAuth: []
 *
 * /api/v1/section/{id}:
 *   get:
 *     summary: Get a section by id
 *     tags:
 *       - Section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8ca0
 *   put:
 *     summary: Update a section
 *     tags:
 *       - Section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8ca0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionInput'
 *           example:
 *             schoolId: 680cf4d5e6e79f54ea8e8c98
 *             classId: 680cf4d5e6e79f54ea8e8c99
 *             name: B
 *   delete:
 *     summary: Delete a section
 *     tags:
 *       - Section
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 680cf4d5e6e79f54ea8e8ca0
 */
const sectionRouter = Router();

sectionRouter.post('/', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), createSection);
sectionRouter.get('/', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), getAllSections);
sectionRouter.get('/:id', authenticate, getSectionById);
sectionRouter.put('/:id', authenticate, authorize([Role.SUPERADMIN, Role.OADMIN]), updateSection);
sectionRouter.delete('/:id', authenticate, authorize([Role.SUPERADMIN]), hardDeleteSection);

export default sectionRouter;