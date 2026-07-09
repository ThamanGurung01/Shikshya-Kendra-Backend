import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  createAccountant,
  getAllAccountants,
  getAccountantById,
  updateAccountant,
  hardDeleteAccountant,
} from '../controllers/accountant.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     AccountantInput:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - gender
 *         - contact
 *         - dob
 *       properties:
 *         name:
 *           type: string
 *           example: Hari Karki
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 1988-07-10
 *         accountant_email:
 *           type: string
 *           format: email
 *           example: accountant@example.com
 *         qualification:
 *           type: string
 *           example: B.Com, CA
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         is_active:
 *           type: boolean
 *           example: true
 *     AccountantUpdateInput:
 *       type: object
 *       properties:
 *         accountantName:
 *           type: string
 *           example: Hari Karki
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 1988-07-10
 *         accountant_email:
 *           type: string
 *           format: email
 *           example: accountant@example.com
 *         qualification:
 *           type: string
 *           example: B.Com, CA
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         name:
 *           type: string
 *           example: Hari Karki
 *         password:
 *           type: string
 *           format: password
 *           example: newpassword123
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         is_active:
 *           type: boolean
 *           example: true
 *     Accountant:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         employeeId:
 *           type: string
 *           example: A-SKS-HK-3A2F
 *         accountantName:
 *           type: string
 *           example: Hari Karki
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 1988-07-10T00:00:00.000Z
 *         accountant_email:
 *           type: string
 *           format: email
 *           example: accountant@example.com
 *         schoolId:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         userId:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *         qualification:
 *           type: string
 *           example: B.Com, CA
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01T00:00:00.000Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-01T12:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-27T10:45:00.000Z
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *     AccountantCreateResponseData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Hari Karki
 *         email:
 *           type: string
 *           format: email
 *           example: hari.karki@school.edu.np
 *         role:
 *           type: string
 *           example: accountant
 *         is_active:
 *           type: boolean
 *           example: true
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         employeeId:
 *           type: string
 *           example: A-SKS-HK-3A2F
 *         accountantName:
 *           type: string
 *           example: Hari Karki
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         accountant_email:
 *           type: string
 *           format: email
 *           example: accountant@example.com
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *         qualification:
 *           type: string
 *           example: B.Com, CA
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *     AccountantCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Accountant created successfully
 *         data:
 *           $ref: '#/components/schemas/AccountantCreateResponseData'
 *     AccountantResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Accountant retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Accountant'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Accountant'
 *
 * /api/v1/accountant:
 *   post:
 *     summary: Create an accountant
 *     tags:
 *       - Accountant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountantInput'
 *     responses:
 *       201:
 *         description: Accountant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountantCreateResponse'
 *             examples:
 *               created:
 *                 summary: Accountant created
 *                 value:
 *                   success: true
 *                   message: Accountant created successfully
 *                   data:
 *                     name: Hari Karki
 *                     email: hari.karki@school.edu.np
 *                     role: accountant
 *                     is_active: true
 *                     profileImage: null
 *                     employeeId: A-SKS-HK-3A2F
 *                     accountantName: Hari Karki
 *                     address: Kathmandu, Nepal
 *                     gender: Male
 *                     contact: 9800000000
 *                     accountant_email: accountant@example.com
 *                     status: active
 *                     qualification: B.Com, CA
 *                     joinDate: 2024-01-01
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *   get:
 *     summary: Get all accountants
 *     tags:
 *       - Accountant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accountants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountantResponse'
 *             examples:
 *               found:
 *                 summary: Found accountants
 *                 value:
 *                   success: true
 *                   message: Accountants retrieved successfully
 *                   data:
 *                     - _id: 680cf4d5e6e79f54ea8e8c99
 *                       employeeId: A-SKS-HK-3A2F
 *                       accountantName: Hari Karki
 *                       address: Kathmandu, Nepal
 *                       gender: Male
 *                       contact: 9800000000
 *                       dob: 1988-07-10T00:00:00.000Z
 *                       accountant_email: accountant@example.com
 *                       schoolId: 680cf4d5e6e79f54ea8e8c99
 *                       userId: 680cf4d5e6e79f54ea8e8c99
 *                       status: active
 *                       qualification: B.Com, CA
 *                       joinDate: 2024-01-01T00:00:00.000Z
 *                       createdAt: 2026-04-01T12:00:00.000Z
 *                       updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: No accountants found
 *                 value:
 *                   success: true
 *                   message: Accountants not found
 *                   data: []
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *
 * /api/v1/accountant/{id}:
 *   get:
 *     summary: Get an accountant by id
 *     tags:
 *       - Accountant
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
 *         description: Accountant retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountantResponse'
 *             examples:
 *               found:
 *                 summary: Found accountant
 *                 value:
 *                   success: true
 *                   message: Accountant retrieved successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8c99
 *                     employeeId: A-SKS-HK-3A2F
 *                     accountantName: Hari Karki
 *                     address: Kathmandu, Nepal
 *                     gender: Male
 *                     contact: 9800000000
 *                     dob: 1988-07-10T00:00:00.000Z
 *                     accountant_email: accountant@example.com
 *                     schoolId: 680cf4d5e6e79f54ea8e8c99
 *                     userId: 680cf4d5e6e79f54ea8e8c99
 *                     status: active
 *                     qualification: B.Com, CA
 *                     joinDate: 2024-01-01T00:00:00.000Z
 *                     createdAt: 2026-04-01T12:00:00.000Z
 *                     updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: Accountant not found
 *                 value:
 *                   success: true
 *                   message: Accountant not found
 *                   data: {}
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   put:
 *     summary: Update an accountant
 *     tags:
 *       - Accountant
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
 *             $ref: '#/components/schemas/AccountantUpdateInput'
 *     responses:
 *       200:
 *         description: Accountant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountantResponse'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Accountant not found
 *   delete:
 *     summary: Permanently delete an accountant
 *     tags:
 *       - Accountant
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
 *         description: Accountant permanently deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Accountant not found
 */
const accountantRouter = Router();

accountantRouter.post('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), createAccountant);
accountantRouter.get('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getAllAccountants);
accountantRouter.get('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), getAccountantById);
accountantRouter.put('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateAccountant);
accountantRouter.delete('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), hardDeleteAccountant);

export default accountantRouter;
