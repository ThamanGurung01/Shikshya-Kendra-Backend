import { Router } from "express";
import {authenticate} from '../middlewares/auth.middleware';
import { createStudent, hardDeleteStudent,getAllStudents,getStudentById,updateStudent } from '../controllers/student.controller';
import Role from "../utils/role.util";
import { authorize } from "../middlewares/role.middleware";

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentInput:
 *       type: object
 *       required:
 *         - address
 *         - contact
 *         - school_id
 *         - name
 *         - email
 *         - password
 *       properties:
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         contact:
 *           type: string
 *           example: 9800000000
 *         student_email:
 *           type: string
 *           format: email
 *           example: student@example.com
 *         school_id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         name:
 *           type: string
 *           example: Anish Shrestha
 *         email:
 *           type: string
 *           format: email
 *           example: anish@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: StrongPass123
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/profile-images/anish.png
 *     Student:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8ca1
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         contact:
 *           type: string
 *           example: 9800000000
 *         student_email:
 *           type: string
 *           format: email
 *           example: student@example.com
 *         school_id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         user_id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8ca0
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-27T10:45:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2026-04-27T10:45:00.000Z
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *     StudentCreateResponseData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Anish Shrestha
 *         email:
 *           type: string
 *           format: email
 *           example: anish@example.com
 *         role:
 *           type: string
 *           example: student
 *         is_active:
 *           type: boolean
 *           example: true
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         contact:
 *           type: string
 *           example: 9800000000
 *         student_email:
 *           type: string
 *           format: email
 *           example: student@example.com
 *     StudentCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Student created successfully
 *         data:
 *           $ref: '#/components/schemas/StudentCreateResponseData'
 *     StudentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Student retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Student'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
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
 *           example: Student permanently deleted successfully
 *
 * /api/v1/student:
 *   post:
 *     summary: Create a student
 *     tags:
 *       - Student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       201:
 *         description: Student created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentCreateResponse'
 *             examples:
 *               created:
 *                 summary: Student and user created
 *                 value:
 *                   success: true
 *                   message: Student created successfully
 *                   data:
 *                     name: Anish Shrestha
 *                     email: anish@example.com
 *                     role: student
 *                     is_active: true
 *                     profileImage: null
 *                     address: Kathmandu, Nepal
 *                     contact: 9800000000
 *                     student_email: student@example.com
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
 *     summary: Get all students
 *     tags:
 *       - Student
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentResponse'
 *             examples:
 *               found:
 *                 summary: Found students
 *                 value:
 *                   success: true
 *                   message: Students retrieved successfully
 *                   data:
 *                     - _id: 680cf4d5e6e79f54ea8e8ca1
 *                       address: Kathmandu, Nepal
 *                       contact: 9800000000
 *                       student_email: student@example.com
 *                       school_id: 680cf4d5e6e79f54ea8e8c99
 *                       user_id: 680cf4d5e6e79f54ea8e8ca0
 *                       createdAt: 2026-04-27T10:45:00.000Z
 *                       updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: No students found
 *                 value:
 *                   success: true
 *                   message: Student not found
 *                   data: []
 *       401:
 *         description: Unauthorized
 *
 * /api/v1/student/{id}:
 *   get:
 *     summary: Get a student by id
 *     tags:
 *       - Student
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
 *         description: Student retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentResponse'
 *             examples:
 *               found:
 *                 summary: Found student
 *                 value:
 *                   success: true
 *                   message: Student retrieved successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8ca1
 *                     address: Kathmandu, Nepal
 *                     contact: 9800000000
 *                     student_email: student@example.com
 *                     school_id: 680cf4d5e6e79f54ea8e8c99
 *                     user_id: 680cf4d5e6e79f54ea8e8ca0
 *                     createdAt: 2026-04-27T10:45:00.000Z
 *                     updatedAt: 2026-04-27T10:45:00.000Z
 *                     deletedAt: null
 *               notFound:
 *                 summary: Student not found
 *                 value:
 *                   success: true
 *                   message: Student not found
 *                   data: {}
 *       400:
 *         description: ID is required or invalid
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update a student
 *     tags:
 *       - Student
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
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentResponse'
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   delete:
 *     summary: Permanently delete a student
 *     tags:
 *       - Student
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
 *         description: Student permanently deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
const studentRouter=Router();
studentRouter.post('/',authenticate,authorize([Role.SUPERADMIN,Role.OADMIN]),createStudent);
studentRouter.get('/',authenticate,authorize([Role.SUPERADMIN,Role.OADMIN]),getAllStudents);
studentRouter.get('/:id',authenticate,getStudentById);
studentRouter.put('/:id',authenticate,authorize([Role.SUPERADMIN,Role.OADMIN]),updateStudent);
studentRouter.delete('/:id',authenticate,authorize([Role.SUPERADMIN]),hardDeleteStudent);
export default studentRouter