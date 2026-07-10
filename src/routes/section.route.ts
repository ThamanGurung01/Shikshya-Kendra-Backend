import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  createSection,
  getAllSections,
  getSectionsByClassId,
  hardDeleteSection,
  updateSection,
} from "../controllers/section.controller";

/**
 * @swagger
 * components:
 *   schemas:
 *     SectionInput:
 *       type: object
 *       required:
 *         - classId
 *         - name
 *       properties:
 *         classId:
 *           type: string
 *         name:
 *           type: string
 *           example: A
 *       example:
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
 *     SectionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Section retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Section'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Section'
 *     SectionCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Section created successfully
 *         data:
 *           $ref: '#/components/schemas/Section'
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
 *           example: Section permanently deleted successfully
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
 *             classId: 680cf4d5e6e79f54ea8e8c99
 *             name: A
 *     responses:
 *       201:
 *         description: Section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SectionCreateResponse'
 *       400:
 *         description: Request failed (validation, unauthorized, or forbidden)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all sections
 *     tags:
 *       - Section
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SectionResponse'
 *       400:
 *         description: Request failed (unauthorized or forbidden)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/v1/section/{id}:
 *   get:
 *     summary: Get a section by class id
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
 *     responses:
 *       200:
 *         description: Sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SectionResponse'
 *       400:
 *         description: Request failed (invalid ID, unauthorized, or not found)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *             classId: 680cf4d5e6e79f54ea8e8c99
 *             name: B
 *     responses:
 *       200:
 *         description: Section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SectionResponse'
 *       400:
 *         description: Request failed (validation, unauthorized, forbidden, or not found)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
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
 *     responses:
 *       200:
 *         description: Section permanently deleted successfully
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
const sectionRouter = Router();

sectionRouter.post(
  "/",
  authenticate,
  authorize([Role.OADMIN, Role.ADMIN]),
  createSection,
);
sectionRouter.get(
  "/",
  authenticate,
  authorize([
    Role.SUPERADMIN,
    Role.OADMIN,
    Role.ADMIN,
    Role.TEACHER,
    Role.STUDENT,
    Role.PARENT,
    Role.LIBRARIAN,
    Role.ACCOUNTANT
  ]),
  getAllSections,
);
sectionRouter.get("/:id", authenticate, getSectionsByClassId);
sectionRouter.put(
  "/:id",
  authenticate,
  authorize([Role.OADMIN, Role.ADMIN]),
  updateSection,
);
sectionRouter.delete(
  "/:id",
  authenticate,
  authorize([Role.OADMIN, Role.ADMIN]),
  hardDeleteSection,
);

export default sectionRouter;
