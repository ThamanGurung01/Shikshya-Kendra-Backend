import {Router} from 'express';
import { authCheck, login, logout } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
const authRouter=Router();
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
 *           example: oadmin@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: password123
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
 * /api/v1/auth/login:
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
 * /api/v1/auth/me:
 *  get:
 *   summary: Get authenticated user
 *   tags:
 *     - Auth
 *   security:
 *     - bearerAuth: []
 *   responses:
 *    200:
 *     description: Authenticated user details
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         success:
 *          type: boolean
 *          example: true
 *         data:
 *          type: object
 *          properties:
 *           _id:
 *            type: string
 *            example: 680cf4d5e6e79f54ea8e8c98
 *           name:
 *            type: string
 *            example: Super Admin
 *           email:
 *            type: string
 *            format: email
 *            example: superadmin@gmail.com
 *           role:
 *            type: string
 *            example: admin
 *           is_active:
 *            type: boolean
 *            example: true
 *           createdAt:
 *            type: string
 *            example: 2026-04-01T12:00:00.000Z
 *           updatedAt:
 *            type: string
 *            example: 2026-04-27T10:45:00.000Z
 *         message:
 *          type: string
 *          example: Authenticated
 *    401:
 *     description: Unauthorized
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         success:
 *          type: boolean
 *          example: false
 *         message:
 *          type: string
 *          example: Unauthorized
 *    404:
 *     description: User not found
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         success:
 *          type: boolean
 *          example: false
 *         message:
 *          type: string
 *          example: User not found
 *    500:
 *     description: Server error
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         success:
 *          type: boolean
 *          example: false
 *         message:
 *          type: string
 *          example: Server error
 * 
 * /api/v1/auth/logout:
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
authRouter.get('/me',authenticate,authCheck);
authRouter.post('/logout',logout);
export default authRouter;