import { Router } from "express";
import {authenticate} from '../middlewares/auth.middleware';
import { createStudent, hardDeleteStudent,getAllStudents,getStudentById,updateStudent } from '../controllers/student.controller';
import Role from "../utils/role.util";
import { authorize } from "../middlewares/role.middleware";
import { uploadMiddleware } from '../middlewares/upload.middleware';

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentDocument:
 *       type: object
 *       properties:
 *         photoUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/files/photo.jpg
 *         birthCertificateUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/files/birth-certificate.pdf
 *         transferCertificateUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/files/transfer-certificate.pdf
 *         previousMarksheetUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/files/previous-marksheet.pdf
 *         citizenshipOrIdUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/files/citizenship.pdf
 *     HealthInfo:
 *       type: object
 *       properties:
 *         bloodGroup:
 *           type: string
 *           nullable: true
 *           example: O+
 *     StudentInput:
 *       type: object
 *       required:
 *         - address
 *         - gender
 *         - contact
 *         - dob
 *         - name
 *         - academicYearId
 *         - classId
 *         - sectionId
 *         - rollNumber
 *       properties:
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
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/profile-images/anish.png
 *         documents:
 *           $ref: '#/components/schemas/StudentDocument'
 *         healthInfo:
 *           $ref: '#/components/schemas/HealthInfo'
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
 *         fatherName:
 *           type: string
 *           example: Ram Shrestha
 *         motherName:
 *           type: string
 *           example: Sita Shrestha
 *         primarygurdianemail:
 *           type: string
 *           format: email
 *           example: parent@example.com
 *         fatherPhone:
 *           type: string
 *           example: 9800000001
 *         motherPhone:
 *           type: string
 *           example: 9800000002
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
 *           default: active
 *           description: Student status
 *         is_active:
 *           type: boolean
 *           description: User active status
 *           example: true
 *         role:
 *           type: string
 *           description: User role
 *           example: student
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
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: Parent ID (populated with parent data)
 *           example: 680cf4d5e6e79f54ea8e8d10
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
 *         documents:
 *           $ref: '#/components/schemas/StudentDocument'
 *         healthInfo:
 *           $ref: '#/components/schemas/HealthInfo'
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
 *         password:
 *           type: string
 *           format: password
 *           example: StrongPass123
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: https://cdn.example.com/profile-images/anish.png
 *         documents:
 *           $ref: '#/components/schemas/StudentDocument'
 *         healthInfo:
 *           $ref: '#/components/schemas/HealthInfo'
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
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: Parent ID to associate with student
 *           example: 680cf4d5e6e79f54ea8e8d10
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
 *                   is_active: true
 *                   status: active
 *                   academicYearId: 680cf4d5e6e79f54ea8e8d00
 *                   classId: 680cf4d5e6e79f54ea8e8d01
 *                   sectionId: 680cf4d5e6e79f54ea8e8d02
 *                   rollNumber: 2
 *                   parentId: 680cf4d5e6e79f54ea8e8d10
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
 *               $ref: '#/components/schemas/MessageResponse'
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
studentRouter.post('/',authenticate,authorize([Role.OADMIN]),uploadMiddleware,createStudent);
studentRouter.get('/',authenticate,authorize([Role.OADMIN]),getAllStudents);
studentRouter.get('/:id',authenticate,getStudentById);
studentRouter.put('/:id',authenticate,authorize([Role.OADMIN]),uploadMiddleware,updateStudent);
studentRouter.delete('/:id',authenticate,authorize([Role.OADMIN]),hardDeleteStudent);
export default studentRouter