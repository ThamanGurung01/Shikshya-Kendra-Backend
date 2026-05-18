import {Router} from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createSchool, hardDeleteSchool,getAllSchools,getSchoolById,updateSchool } from '../controllers/school.controller';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import { uploadMiddleware } from '../middlewares/upload.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     SchoolDocument:
 *       type: object
 *       properties:
 *         panCertificate:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: application/pdf
 *             value:
 *               type: string
 *               format: uri
 *               example: https://cdn.example.com/files/pan-certificate.pdf
 *         registrationCertificate:
 *           type: string
 *           example: registration-certificate.pdf
 *     SchoolCreateInput:
 *       type: object
 *       required:
 *         - school_name
 *         - address
 *         - contact
 *         - school_email
 *         - name
 *         - email
 *         - password
 *       properties:
 *         school_name:
 *           type: string
 *           example: Shikshya Kendra School
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         contact:
 *           type: string
 *           example: 9800000000
 *         school_email:
 *           type: string
 *           format: email
 *           example: school@example.com
 *         website:
 *           type: string
 *           format: uri
 *           example: https://school.example.com
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         map:
 *           type: string
 *           format: uri
 *           example: https://maps.example.com/?q=...
 *         city:
 *           type: string
 *           example: Kathmandu
 *         country:
 *           type: string
 *           example: Nepal
 *         documents:
 *           $ref: '#/components/schemas/SchoolDocument'
 *         name:
 *           type: string
 *           example: School Owner Admin
 *         email:
 *           type: string
 *           format: email
 *           example: oadmin@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: StrongPass123
 *     SchoolInput:
 *       type: object
 *       required:
 *         - school_name
 *         - address
 *         - contact
 *         - school_email
 *       properties:
 *         school_name:
 *           type: string
 *           example: Shikshya Kendra School
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         contact:
 *           type: string
 *           example: 9800000000
 *         school_email:
 *           type: string
 *           format: email
 *           example: school@example.com
 *         website:
 *           type: string
 *           format: uri
 *           example: https://school.example.com
 *         kyc_files:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SchoolDocument'
 *         map:
 *           type: string
 *           example: https://maps.example.com/?q=...
 *         city:
 *           type: string
 *           example: Kathmandu
 *         country:
 *           type: string
 *           example: Nepal
 *         documents:
 *           $ref: '#/components/schemas/SchoolDocument'
 *     School:
 *       allOf:
 *         - $ref: '#/components/schemas/SchoolInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 680cf4d5e6e79f54ea8e8c99
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: 2026-04-01T12:00:00.000Z
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               example: 2026-04-27T10:45:00.000Z
 *             deletedAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               example: null
 *             verifiedAt:
 *               type: string
 *               format: date-time
 *               example: 2026-04-27T10:45:00.000Z
 *     SchoolCreateResponseData:
 *       type: object
 *       properties:
 *         slug:
 *           type: string
 *           example: shikshya-kendra-school
 *         name:
 *           type: string
 *           example: School Owner Admin
 *         email:
 *           type: string
 *           format: email
 *           example: oadmin@example.com
 *         role:
 *           type: string
 *           example: oadmin
 *         is_active:
 *           type: boolean
 *           example: true
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         school_name:
 *           type: string
 *           example: Shikshya Kendra School
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         contact:
 *           type: string
 *           example: 9800000000
 *         school_email:
 *           type: string
 *           format: email
 *           example: school@example.com
 *         website:
 *           type: string
 *           format: uri
 *           example: https://school.example.com
 *         map:
 *           type: string
 *           format: uri
 *           nullable: true
 *         city:
 *           type: string
 *           nullable: true
 *         country:
 *           type: string
 *           nullable: true
 *         documents:
 *           $ref: '#/components/schemas/SchoolDocument'
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-27T10:45:00.000Z
 *     SchoolCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: OAdmin for school created successfully
 *         data:
 *           $ref: '#/components/schemas/SchoolCreateResponseData'
 *     SchoolResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: School retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/School'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/School'
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
 *           example: School deleted successfully
 *
 * /api/v1/school:
 *   post:
 *     summary: Create a school
 *     tags:
 *       - School
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchoolCreateInput'
 *     responses:
 *       201:
 *         description: OAdmin for school created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolCreateResponse'
 *             examples:
 *               created:
 *                 summary: School and OAdmin created
 *                 value:
 *                   success: true
 *                   message: OAdmin for school created successfully
 *                   data:
 *                     slug: shikshya-kendra-school
 *                     name: School Owner Admin
 *                     email: oadmin@example.com
 *                     role: oadmin
 *                     is_active: true
 *                     profileImage: null
 *                     school_name: Shikshya Kendra School
 *                     address: Kathmandu, Nepal
 *                     contact: 9800000000
 *                     school_email: school@example.com
 *                     website: https://school.example.com
 *                     map: https://maps.example.com/?q=...
 *                     city: Kathmandu
 *                     country: Nepal
 *                     documents:
 *                       panCertificate:
 *                         type: application/pdf
 *                         value: https://cdn.example.com/files/pan-certificate.pdf
 *                       registrationCertificate: registration-certificate.pdf
 *                     verifiedAt: 2026-04-27T10:45:00.000Z
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
 *     summary: Get all schools
 *     tags:
 *       - School
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schools retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolResponse'
 *             examples:
 *               found:
 *                 summary: Found schools
 *                 value:
 *                   success: true
 *                   message: Schools retrieved successfully
 *                   data:
 *                     - _id: 680cf4d5e6e79f54ea8e8c99
 *                       slug: shikshya-kendra-school
 *                       school_name: Shikshya Kendra School
 *                       address: Kathmandu, Nepal
 *                       contact: 9800000000
 *                       school_email: school@example.com
 *                       website: https://school.example.com
 *                       kyc_files: []
 *                       createdAt: 2026-04-01T12:00:00.000Z
 *                       updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: No schools found
 *                 value:
 *                   success: true
 *                   message: School not found
 *                   data: []
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/school/{id}:
 *   get:
 *     summary: Get a school by id
 *     tags:
 *       - School
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
 *         description: School retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolResponse'
 *             examples:
 *               found:
 *                 summary: Found school
 *                 value:
 *                   success: true
 *                   message: School retrieved successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8c99
 *                     slug: shikshya-kendra-school
 *                     school_name: Shikshya Kendra School
 *                     address: Kathmandu, Nepal
 *                     contact: 9800000000
 *                     school_email: school@example.com
 *                     website: https://school.example.com
 *                     kyc_files: []
 *                     documents:
 *                       panCertificate:
 *                         type: application/pdf
 *                         value: https://cdn.example.com/files/pan-certificate.pdf
 *                       registrationCertificate: registration-certificate.pdf
 *                     createdAt: 2026-04-01T12:00:00.000Z
 *                     updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: School not found
 *                 value:
 *                   success: true
 *                   message: School not found
 *                   data: {}
 *       400:
 *         description: ID is required
 *       404:
 *         description: School not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update a school
 *     tags:
 *       - School
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
 *             $ref: '#/components/schemas/SchoolCreateInput'
 *     responses:
 *       200:
 *         description: School updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchoolResponse'
 *       400:
 *         description: Validation failed
 *       404:
 *         description: School not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   delete:
 *     summary: Permanently delete a school
 *     tags:
 *       - School
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
 *         description: School permanently deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: School not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
const schoolRouter=Router();
schoolRouter.post('/',authenticate,authorize([Role.SUPERADMIN, Role.OADMIN]),uploadMiddleware,createSchool);
schoolRouter.get('/',authenticate,authorize([Role.SUPERADMIN,Role.OADMIN]),getAllSchools);
schoolRouter.get('/:id',authenticate,getSchoolById);
schoolRouter.put('/:id',authenticate,authorize([Role.SUPERADMIN, Role.OADMIN]),uploadMiddleware,updateSchool);
schoolRouter.delete('/:id',authenticate,authorize([Role.SUPERADMIN]),hardDeleteSchool);
export default schoolRouter;