import {Router} from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import { createAcademicYear, getAcademicYearById, getAllAcademicYears, hardDeleteAcademicYear, updateAcademicYear } from '../controllers/academic-year.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     AcademicYearInput:
 *       type: object
 *       required:
 *         - schoolId
 *         - name
 *         - startDate
 *         - endDate
 *       properties:
 *         schoolId:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c98
 *         name:
 *           type: string
 *           example: 2025-2026
 *         startDate:
 *           type: string
 *           example: 2025-04-01
 *         endDate:
 *           type: string
 *           example: 2026-03-31
 *     AcademicYear:
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
 *           example: 2025-2026
 *         startDate:
 *           type: string
 *           example: 2025-04-01
 *         endDate:
 *           type: string
 *           example: 2026-03-31
 *         isCurrent:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-27T10:45:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-27T10:45:00.000Z
 *     AcademicYearResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: AcademicYear retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/AcademicYear'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicYear'
 *     AcademicYearCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: OAdmin for AcademicYear created successfully
 *         data:
 *           $ref: '#/components/schemas/AcademicYear'
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
 *     MessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: AcademicYear permanently deleted successfully
 *
 * /api/v1/academic-year:
 *   post:
 *     summary: Create an academic year
 *     tags:
 *       - Academic Year
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicYearInput'
 *     responses:
 *       201:
 *         description: Academic year created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearCreateResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get all academic years
 *     tags:
 *       - Academic Year
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Academic years retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 * /api/v1/academic-year/{id}:
 *   get:
 *     summary: Get an academic year by id
 *     tags:
 *       - Academic Year
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic year retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearResponse'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update an academic year
 *     tags:
 *       - Academic Year
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicYearInput'
 *     responses:
 *       200:
 *         description: Academic year updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYearResponse'
 *       400:
 *         description: Validation failed or invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: AcademicYear not found
 *   delete:
 *     summary: Permanently delete an academic year
 *     tags:
 *       - Academic Year
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Academic year permanently deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: AcademicYear not found
 */
const academicYearRouter=Router();
academicYearRouter.post('/',authenticate,authorize([Role.OADMIN, Role.ADMIN]),createAcademicYear);
academicYearRouter.get('/',authenticate,authorize([Role.SUPERADMIN, Role.OADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.LIBRARIAN, Role.ACCOUNTANT]),getAllAcademicYears);
academicYearRouter.get('/:id',authenticate,getAcademicYearById);
academicYearRouter.put('/:id',authenticate,authorize([Role.OADMIN, Role.ADMIN]),updateAcademicYear);
academicYearRouter.delete('/:id',authenticate,authorize([Role.OADMIN, Role.ADMIN]),hardDeleteAcademicYear);
export default academicYearRouter;