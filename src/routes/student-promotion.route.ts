import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/role.middleware";
import Role from "../utils/role.util";
import {
  executeBulkPromotion,
  getPromotionPreview,
  getStudentHistory,
} from "../controllers/student-promotion.controller";

/**
 * @swagger
 * tags:
 *   name: StudentPromotion
 *   description: Student Class Upgrade & Promotion APIs
 */

const studentPromotionRouter = Router();

studentPromotionRouter.use(authenticate);

/**
 * @swagger
 * /api/v1/student-promotion/history/{studentId}:
 *   get:
 *     summary: Get student academic timeline and enrollment history
 *     tags: [StudentPromotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Timeline retrieved successfully
 */
studentPromotionRouter.get("/history/:studentId", getStudentHistory);

/**
 * @swagger
 * /api/v1/student-promotion/preview:
 *   get:
 *     summary: Preview class promotion eligibility and fee warnings
 *     tags: [StudentPromotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sourceAcademicYearId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sourceClassId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sourceSectionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetAcademicYearId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Preview list retrieved
 */
studentPromotionRouter.get(
  "/preview",
  authorize([Role.OADMIN, Role.ADMIN]),
  getPromotionPreview,
);

/**
 * @swagger
 * /api/v1/student-promotion/bulk:
 *   post:
 *     summary: Execute bulk class upgrade / student promotion
 *     tags: [StudentPromotion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceAcademicYearId
 *               - sourceClassId
 *               - targetAcademicYearId
 *               - targetClassId
 *               - targetSectionId
 *               - promotions
 *     responses:
 *       200:
 *         description: Class upgrade executed successfully
 */
studentPromotionRouter.post(
  "/bulk",
  authorize([Role.OADMIN, Role.ADMIN]),
  executeBulkPromotion,
);

export default studentPromotionRouter;
