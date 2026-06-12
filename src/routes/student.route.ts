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
 *         - gender
 *         - contact
 *         - dob
 *         - name
 *         - email
 *         - password
 *         - academicYearId
 *         - classId
 *         - sectionId
 *         - rollNumber
 *       properties:
 *         admissionNumber:
 *           type: string
 *           example: SK-AS-A3F2
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           enum:
 *             - male
 *             - female
 *             - other
 *           example: male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 2005-06-15
 *         student_email:
 *           type: string
 *           format: email
 *           example: student@example.com
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
 *         academicYearId:
 *           type: string
 *           description: Academic year ID for enrollment
 *           example: 680cf4d5e6e79f54ea8e8d00
 *         classId:
 *           type: string
 *           description: Class ID for enrollment
 *           example: 680cf4d5e6e79f54ea8e8d01
 *         sectionId:
 *           type: string
 *           description: Section ID for enrollment
 *           example: 680cf4d5e6e79f54ea8e8d02
 *         rollNumber:
 *           type: number
 *           description: Roll number for enrollment
 *           example: 1
 *         promotedFromEnrollmentId:
 *           type: string
 *           nullable: true
 *           description: Previous enrollment ID if promoted
 *         status:
 *           type: string
 *           enum:
 *             - enrolled
 *             - pending
 *             - waitlisted
 *             - dropped
 *             - completed
 *             - failed
 *             - withdrawn
 *             - cancelled
 *           default: pending
 *           description: Enrollment status
 *         is_active:
 *           type: boolean
 *           description: User active status
 *           example: true
 *         role:
 *           type: string
 *           description: User role
 *           example: student
 *         userId:
 *           type: string
 *           description: User ID (set server-side)
 *           example: 680cf4d5e6e79f54ea8e8ca0
 *     Student:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8ca1
 *         admissionNumber:
 *           type: string
 *           example: STU-2026-001
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           example: male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 2005-06-15
 *         student_email:
 *           type: string
 *           format: email
 *           example: student@example.com
 *         schoolId:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         userId:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8ca0
 *         status:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *             - transfered
 *             - graduated
 *             - suspended
 *             - expelled
 *             - withdrawn
 *           example: active
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
 *         admissionNumber:
 *           type: string
 *           example: SK-AS-A3F2
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
 *     StudentUpdateInput:
 *       type: object
 *       properties:
 *         admissionNumber:
 *           type: string
 *           example: STU-2026-001
 *         address:
 *           type: string
 *           example: Kathmandu, Nepal
 *         gender:
 *           type: string
 *           enum:
 *             - male
 *             - female
 *             - other
 *           example: male
 *         contact:
 *           type: string
 *           example: 9800000000
 *         dob:
 *           type: string
 *           format: date
 *           example: 2005-06-15
 *         student_email:
 *           type: string
 *           format: email
 *           example: student@example.com
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
 *         status:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *             - transfered
 *             - graduated
 *             - suspended
 *             - expelled
 *             - withdrawn
 *           example: active
 *         is_active:
 *           type: boolean
 *           description: User active status
 *           example: true
 *         role:
 *           type: string
 *           description: User role
 *           example: student
 *         schoolId:
 *           type: string
 *           description: School ID
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         userId:
 *           type: string
 *           description: User ID
 *           example: 680cf4d5e6e79f54ea8e8ca0
 *         academicYearId:
 *           type: string
 *           description: Academic year ID for enrollment
 *           example: 680cf4d5e6e79f54ea8e8d00
 *         classId:
 *           type: string
 *           description: Class ID for enrollment
 *           example: 680cf4d5e6e79f54ea8e8d01
 *         sectionId:
 *           type: string
 *           description: Section ID for enrollment
 *           example: 680cf4d5e6e79f54ea8e8d02
 *         rollNumber:
 *           type: number
 *           description: Roll number for enrollment
 *           example: 1
 *         promotedFromEnrollmentId:
 *           type: string
 *           nullable: true
 *           description: Previous enrollment ID if promoted
 *         studentEnrollmentStatus:
 *           type: string
 *           enum:
 *             - enrolled
 *             - pending
 *             - waitlisted
 *             - dropped
 *             - completed
 *             - failed
 *             - withdrawn
 *             - cancelled
 *           description: Enrollment status
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
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Student not found
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
 *           examples:
 *               createRequest:
 *                 summary: Create student request
 *                 value:
 *                   address: Kathmandu, Nepal
 *                   gender: male
 *                   contact: "9800000000"
 *                   dob: 2005-06-15
 *                   status: active
 *                   student_email: student@example.com
 *                   name: Anish Shrestha
 *                   email: anish@example.com
 *                   password: password123
 *                   academicYearId: 680cf4d5e6e79f54ea8e8d00
 *                   classId: 680cf4d5e6e79f54ea8e8d01
 *                   sectionId: 680cf4d5e6e79f54ea8e8d02
 *                   rollNumber: 1
 *                   studentEnrollmentStatus: enrolled
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
 *                     admissionNumber: SK-AS-A3F2
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *                       admissionNumber: STU-2026-001
 *                       address: Kathmandu, Nepal
 *                       gender: male
 *                       contact: 9800000000
 *                       dob: 2005-06-15
 *                       student_email: student@example.com
 *                       status: active
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Student ID
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
 *                     admissionNumber: STU-2026-001
 *                     address: Kathmandu, Nepal
 *                     gender: male
 *                     contact: 9800000000
 *                     dob: 2005-06-15
 *                     student_email: student@example.com
 *                     status: active
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Student ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentUpdateInput'
 *           examples:
 *               updateRequest:
 *                 summary: Update student request
 *                 value:
 *                   address: Pokhara, Nepal
 *                   contact: "9800000001"
 *                   gender: male
 *                   dob: 2005-06-15
 *                   name: Anish Shrestha Updated
 *                   email: anish.updated@example.com
 *                   is_active: true
 *                   status: active
 *                   academicYearId: 680cf4d5e6e79f54ea8e8d00
 *                   classId: 680cf4d5e6e79f54ea8e8d01
 *                   sectionId: 680cf4d5e6e79f54ea8e8d02
 *                   rollNumber: 2
 *                   studentEnrollmentStatus: enrolled
 *     responses:
 *       200:
 *         description: Student updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentResponse'
 *             examples:
 *               updated:
 *                 summary: Student updated
 *                 value:
 *                   success: true
 *                   message: Student updated successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8ca1
 *                     admissionNumber: STU-2026-001
 *                     address: Pokhara, Nepal
 *                     gender: male
 *                     contact: 9800000001
 *                     dob: 2005-06-15
 *                     student_email: student@example.com
 *                     status: active
 *                     createdAt: 2026-04-27T10:45:00.000Z
 *                     updatedAt: 2026-04-28T12:00:00.000Z
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *         description: Student ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student permanently deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentResponse'
 *             examples:
 *               deleted:
 *                 summary: Student deleted
 *                 value:
 *                   success: true
 *                   message: Student permanently deleted successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8ca1
 *                     admissionNumber: STU-2026-001
 *                     address: Kathmandu, Nepal
 *                     gender: male
 *                     contact: 9800000000
 *                     dob: 2005-06-15
 *                     student_email: student@example.com
 *                     status: active
 *                     createdAt: 2026-04-27T10:45:00.000Z
 *                     updatedAt: 2026-04-27T10:45:00.000Z
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const studentRouter=Router();
studentRouter.post('/',authenticate,authorize([Role.OADMIN]),createStudent);
studentRouter.get('/',authenticate,authorize([Role.OADMIN]),getAllStudents);
studentRouter.get('/:id',authenticate,getStudentById);
studentRouter.put('/:id',authenticate,authorize([Role.OADMIN]),updateStudent);
studentRouter.delete('/:id',authenticate,authorize([Role.OADMIN]),hardDeleteStudent);
export default studentRouter