import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  hardDeleteAdmin,
  resetUserPassword,
} from '../controllers/admin.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminInput:
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
 *           example: Ram Sharma
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
 *           example: 1985-06-15
 *         admin_email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *         qualification:
 *           type: string
 *           example: M.Ed. in Education Administration
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
 *     AdminUpdateInput:
 *       type: object
 *       properties:
 *         adminName:
 *           type: string
 *           example: Ram Sharma
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
 *           example: 1985-06-15
 *         admin_email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *         qualification:
 *           type: string
 *           example: M.Ed. in Education Administration
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         name:
 *           type: string
 *           example: Ram Sharma
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
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         employeeId:
 *           type: string
 *           example: AD-SKS-RS-3A2F
 *         adminName:
 *           type: string
 *           example: Ram Sharma
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
 *           example: 1985-06-15T00:00:00.000Z
 *         admin_email:
 *           type: string
 *           format: email
 *           example: admin@example.com
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
 *           example: M.Ed. in Education Administration
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
 *     AdminCreateResponseData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Ram Sharma
 *         email:
 *           type: string
 *           format: email
 *           example: ram.sharma@school.edu.np
 *         role:
 *           type: string
 *           example: admin
 *         is_active:
 *           type: boolean
 *           example: true
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         employeeId:
 *           type: string
 *           example: AD-SKS-RS-3A2F
 *         adminName:
 *           type: string
 *           example: Ram Sharma
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         admin_email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *         qualification:
 *           type: string
 *           example: M.Ed. in Education Administration
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *     AdminCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Admin created successfully
 *         data:
 *           $ref: '#/components/schemas/AdminCreateResponseData'
 *     AdminResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Admin retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Admin'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Admin'
 *
 * /api/v1/admin:
 *   post:
 *     summary: Create an admin
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminInput'
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminCreateResponse'
 *             examples:
 *               created:
 *                 summary: Admin created
 *                 value:
 *                   success: true
 *                   message: Admin created successfully
 *                   data:
 *                     name: Ram Sharma
 *                     email: ram.sharma@school.edu.np
 *                     role: admin
 *                     is_active: true
 *                     profileImage: null
 *                     employeeId: AD-SKS-RS-3A2F
 *                     adminName: Ram Sharma
 *                     address: Kathmandu, Nepal
 *                     gender: Male
 *                     contact: 9800000000
 *                     admin_email: admin@example.com
 *                     status: active
 *                     qualification: M.Ed. in Education Administration
 *                     joinDate: 2024-01-01
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *   get:
 *     summary: Get all admins
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminResponse'
 *             examples:
 *               found:
 *                 summary: Found admins
 *                 value:
 *                   success: true
 *                   message: Admins retrieved successfully
 *                   data:
 *                     - _id: 680cf4d5e6e79f54ea8e8c99
 *                       employeeId: AD-SKS-RS-3A2F
 *                       adminName: Ram Sharma
 *                       address: Kathmandu, Nepal
 *                       gender: Male
 *                       contact: 9800000000
 *                       dob: 1985-06-15T00:00:00.000Z
 *                       admin_email: admin@example.com
 *                       schoolId: 680cf4d5e6e79f54ea8e8c99
 *                       userId: 680cf4d5e6e79f54ea8e8c99
 *                       status: active
 *                       qualification: M.Ed. in Education Administration
 *                       joinDate: 2024-01-01T00:00:00.000Z
 *                       createdAt: 2026-04-01T12:00:00.000Z
 *                       updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: No admins found
 *                 value:
 *                   success: true
 *                   message: Admins not found
 *                   data: []
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *
 * /api/v1/admin/{id}:
 *   get:
 *     summary: Get an admin by id
 *     tags:
 *       - Admin
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
 *         description: Admin retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminResponse'
 *             examples:
 *               found:
 *                 summary: Found admin
 *                 value:
 *                   success: true
 *                   message: Admin retrieved successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8c99
 *                     employeeId: AD-SKS-RS-3A2F
 *                     adminName: Ram Sharma
 *                     address: Kathmandu, Nepal
 *                     gender: Male
 *                     contact: 9800000000
 *                     dob: 1985-06-15T00:00:00.000Z
 *                     admin_email: admin@example.com
 *                     schoolId: 680cf4d5e6e79f54ea8e8c99
 *                     userId: 680cf4d5e6e79f54ea8e8c99
 *                     status: active
 *                     qualification: M.Ed. in Education Administration
 *                     joinDate: 2024-01-01T00:00:00.000Z
 *                     createdAt: 2026-04-01T12:00:00.000Z
 *                     updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: Admin not found
 *                 value:
 *                   success: true
 *                   message: Admin not found
 *                   data: {}
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   put:
 *     summary: Update an admin
 *     tags:
 *       - Admin
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
 *             $ref: '#/components/schemas/AdminUpdateInput'
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminResponse'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 *   delete:
 *     summary: Permanently delete an admin
 *     tags:
 *       - Admin
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
 *         description: Admin permanently deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Admin not found
 */
const adminRouter = Router();

adminRouter.post('/reset-user-password', authenticate, authorize([Role.OADMIN, Role.ADMIN, Role.SUPERADMIN]), resetUserPassword);
adminRouter.post('/', authenticate, authorize([Role.OADMIN,Role.ADMIN]), createAdmin);
adminRouter.get('/', authenticate, authorize([Role.OADMIN,Role.ADMIN]), getAllAdmins);
adminRouter.get('/:id', authenticate, authorize([Role.OADMIN,Role.ADMIN]), getAdminById);
adminRouter.put('/:id', authenticate, authorize([Role.OADMIN,Role.ADMIN]), updateAdmin);
adminRouter.delete('/:id', authenticate, authorize([Role.OADMIN,Role.ADMIN]), hardDeleteAdmin);

export default adminRouter;
