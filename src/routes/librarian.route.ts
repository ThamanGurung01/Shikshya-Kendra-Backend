import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  createLibrarian,
  getAllLibrarians,
  getLibrarianById,
  updateLibrarian,
  hardDeleteLibrarian,
} from '../controllers/librarian.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     LibrarianInput:
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
 *           example: Sita Thapa
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Female
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 1990-03-20
 *         librarian_email:
 *           type: string
 *           format: email
 *           example: librarian@example.com
 *         qualification:
 *           type: string
 *           example: M.Lib. in Library Science
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
 *     LibrarianUpdateInput:
 *       type: object
 *       properties:
 *         librarianName:
 *           type: string
 *           example: Sita Thapa
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Female
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 1990-03-20
 *         librarian_email:
 *           type: string
 *           format: email
 *           example: librarian@example.com
 *         qualification:
 *           type: string
 *           example: M.Lib. in Library Science
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         name:
 *           type: string
 *           example: Sita Thapa
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
 *     Librarian:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         employeeId:
 *           type: string
 *           example: L-SKS-ST-3A2F
 *         librarianName:
 *           type: string
 *           example: Sita Thapa
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Female
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 1990-03-20T00:00:00.000Z
 *         librarian_email:
 *           type: string
 *           format: email
 *           example: librarian@example.com
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
 *           example: M.Lib. in Library Science
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
 *     LibrarianCreateResponseData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Sita Thapa
 *         email:
 *           type: string
 *           format: email
 *           example: sita.thapa@school.edu.np
 *         role:
 *           type: string
 *           example: librarian
 *         is_active:
 *           type: boolean
 *           example: true
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         employeeId:
 *           type: string
 *           example: L-SKS-ST-3A2F
 *         librarianName:
 *           type: string
 *           example: Sita Thapa
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: Female
 *         contact:
 *           type: string
 *           example: 9800000000
 *         librarian_email:
 *           type: string
 *           format: email
 *           example: librarian@example.com
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *         qualification:
 *           type: string
 *           example: M.Lib. in Library Science
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *     LibrarianCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Librarian created successfully
 *         data:
 *           $ref: '#/components/schemas/LibrarianCreateResponseData'
 *     LibrarianResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Librarian retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Librarian'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Librarian'
 *
 * /api/v1/librarian:
 *   post:
 *     summary: Create a librarian
 *     tags:
 *       - Librarian
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LibrarianInput'
 *     responses:
 *       201:
 *         description: Librarian created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LibrarianCreateResponse'
 *             examples:
 *               created:
 *                 summary: Librarian created
 *                 value:
 *                   success: true
 *                   message: Librarian created successfully
 *                   data:
 *                     name: Sita Thapa
 *                     email: sita.thapa@school.edu.np
 *                     role: librarian
 *                     is_active: true
 *                     profileImage: null
 *                     employeeId: L-SKS-ST-3A2F
 *                     librarianName: Sita Thapa
 *                     address: Kathmandu, Nepal
 *                     gender: Female
 *                     contact: 9800000000
 *                     librarian_email: librarian@example.com
 *                     status: active
 *                     qualification: M.Lib. in Library Science
 *                     joinDate: 2024-01-01
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *   get:
 *     summary: Get all librarians
 *     tags:
 *       - Librarian
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Librarians retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LibrarianResponse'
 *             examples:
 *               found:
 *                 summary: Found librarians
 *                 value:
 *                   success: true
 *                   message: Librarians retrieved successfully
 *                   data:
 *                     - _id: 680cf4d5e6e79f54ea8e8c99
 *                       employeeId: L-SKS-ST-3A2F
 *                       librarianName: Sita Thapa
 *                       address: Kathmandu, Nepal
 *                       gender: Female
 *                       contact: 9800000000
 *                       dob: 1990-03-20T00:00:00.000Z
 *                       librarian_email: librarian@example.com
 *                       schoolId: 680cf4d5e6e79f54ea8e8c99
 *                       userId: 680cf4d5e6e79f54ea8e8c99
 *                       status: active
 *                       qualification: M.Lib. in Library Science
 *                       joinDate: 2024-01-01T00:00:00.000Z
 *                       createdAt: 2026-04-01T12:00:00.000Z
 *                       updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: No librarians found
 *                 value:
 *                   success: true
 *                   message: Librarians not found
 *                   data: []
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *
 * /api/v1/librarian/{id}:
 *   get:
 *     summary: Get a librarian by id
 *     tags:
 *       - Librarian
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
 *         description: Librarian retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LibrarianResponse'
 *             examples:
 *               found:
 *                 summary: Found librarian
 *                 value:
 *                   success: true
 *                   message: Librarian retrieved successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8c99
 *                     employeeId: L-SKS-ST-3A2F
 *                     librarianName: Sita Thapa
 *                     address: Kathmandu, Nepal
 *                     gender: Female
 *                     contact: 9800000000
 *                     dob: 1990-03-20T00:00:00.000Z
 *                     librarian_email: librarian@example.com
 *                     schoolId: 680cf4d5e6e79f54ea8e8c99
 *                     userId: 680cf4d5e6e79f54ea8e8c99
 *                     status: active
 *                     qualification: M.Lib. in Library Science
 *                     joinDate: 2024-01-01T00:00:00.000Z
 *                     createdAt: 2026-04-01T12:00:00.000Z
 *                     updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: Librarian not found
 *                 value:
 *                   success: true
 *                   message: Librarian not found
 *                   data: {}
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   put:
 *     summary: Update a librarian
 *     tags:
 *       - Librarian
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
 *             $ref: '#/components/schemas/LibrarianUpdateInput'
 *     responses:
 *       200:
 *         description: Librarian updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LibrarianResponse'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Librarian not found
 *   delete:
 *     summary: Permanently delete a librarian
 *     tags:
 *       - Librarian
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
 *         description: Librarian permanently deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Librarian not found
 */
const librarianRouter = Router();

librarianRouter.post('/', authenticate, authorize([Role.OADMIN, Role.ADMIN]), createLibrarian);
librarianRouter.get('/', authenticate, authorize([Role.OADMIN, Role.ADMIN, Role.ACCOUNTANT]), getAllLibrarians);
librarianRouter.get('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN, Role.ACCOUNTANT]), getLibrarianById);
librarianRouter.put('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), updateLibrarian);
librarianRouter.delete('/:id', authenticate, authorize([Role.OADMIN, Role.ADMIN]), hardDeleteLibrarian);

export default librarianRouter;
