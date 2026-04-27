import {Router} from 'express';
import { login, refreshToken, logout } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
export const authRouter=Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: secret123
 *     AuthUserData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c98
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           example: admin
 *         verified_date:
 *           type: string
 *           nullable: true
 *           example: 2026-04-27T10:40:00.000Z
 *     ValidationErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Validation failed
 *         errors:
 *           type: object
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Logged out successfully
 *
 * /auth/login:
 *  post:
 *   summary: User login
 *   tags:
 *     - Auth
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/LoginRequest'
 *   responses:
 *    200:
 *     description: Successful login
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *          userData:
 *            $ref: '#/components/schemas/AuthUserData'
 *          message:
 *            type: string
 *            example: Login successful
 *    400:
 *     description: Validation failed
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ValidationErrorResponse'
 *    401:
 *     description: Invalid email or password
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *          message:
 *            type: string
 *            example: Invalid email or password
 *
 * /auth/refresh-token:
 *  post:
 *   summary: Refresh access token
 *   tags:
 *     - Auth
 *   responses:
 *    200:
 *     description: Access token refreshed
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *          message:
 *            type: string
 *            example: Access token refreshed
 *    401:
 *     description: Invalid refresh token
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *          message:
 *            type: string
 *            example: Invalid refresh token
 *
 * /auth/logout:
 *  post:
 *   summary: Logout current user
 *   tags:
 *     - Auth
 *   responses:
 *    200:
 *     description: Logged out successfully
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/MessageResponse'
 *    500:
 *     description: Server error
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *          message:
 *            type: string
 *            example: Server error
 */
authRouter.post('/login',login);
authRouter.post('/refresh-token',refreshToken);
authRouter.post('/logout',logout);
