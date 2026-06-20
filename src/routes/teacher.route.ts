import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import Role from '../utils/role.util';
import {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  hardDeleteTeacher,
} from '../controllers/teacher.controller';

/**
 * @swagger
 * components:
 *   schemas:
 *     TeacherInput:
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
 *           example: 1995-06-15
 *         teacher_email:
 *           type: string
 *           format: email
 *           example: teacher@example.com
 *         qualification:
 *           type: string
 *           example: M.Ed. in Mathematics
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
 *     TeacherUpdateInput:
 *       type: object
 *       properties:
 *         teacherName:
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
 *           example: 1995-06-15
 *         teacher_email:
 *           type: string
 *           format: email
 *           example: teacher@example.com
 *         qualification:
 *           type: string
 *           example: M.Ed. in Mathematics
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
 *     Teacher:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 680cf4d5e6e79f54ea8e8c99
 *         employeeId:
 *           type: string
 *           example: T-SKS-RS-3A2F
 *         teacherName:
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
 *           example: 1995-06-15T00:00:00.000Z
 *         teacher_email:
 *           type: string
 *           format: email
 *           example: teacher@example.com
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
 *           example: M.Ed. in Mathematics
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
 *     TeacherCreateResponseData:
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
 *           example: teacher
 *         is_active:
 *           type: boolean
 *           example: true
 *         profileImage:
 *           type: string
 *           format: uri
 *           nullable: true
 *         employeeId:
 *           type: string
 *           example: T-SKS-RS-3A2F
 *         teacherName:
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
 *         teacher_email:
 *           type: string
 *           format: email
 *           example: teacher@example.com
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *         qualification:
 *           type: string
 *           example: M.Ed. in Mathematics
 *         joinDate:
 *           type: string
 *           format: date
 *           example: 2024-01-01
 *     TeacherCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Teacher created successfully
 *         data:
 *           $ref: '#/components/schemas/TeacherCreateResponseData'
 *     TeacherResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Teacher retrieved successfully
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Teacher'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Teacher'
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
 *           example: Teacher deleted successfully
 *
 * /api/v1/teacher:
 *   post:
 *     summary: Create a teacher
 *     tags:
 *       - Teacher
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeacherInput'
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherCreateResponse'
 *             examples:
 *               created:
 *                 summary: Teacher created
 *                 value:
 *                   success: true
 *                   message: Teacher created successfully
 *                   data:
 *                     name: Ram Sharma
 *                     email: ram.sharma@school.edu.np
 *                     role: teacher
 *                     is_active: true
 *                     profileImage: null
 *                     employeeId: T-SKS-RS-3A2F
 *                     teacherName: Ram Sharma
 *                     address: Kathmandu, Nepal
 *                     gender: Male
 *                     contact: 9800000000
 *                     teacher_email: teacher@example.com
 *                     status: active
 *                     qualification: M.Ed. in Mathematics
 *                     joinDate: 2024-01-01
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *   get:
 *     summary: Get all teachers
 *     tags:
 *       - Teacher
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teachers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherResponse'
 *             examples:
 *               found:
 *                 summary: Found teachers
 *                 value:
 *                   success: true
 *                   message: Teachers retrieved successfully
 *                   data:
 *                     - _id: 680cf4d5e6e79f54ea8e8c99
 *                       employeeId: T-SKS-RS-3A2F
 *                       teacherName: Ram Sharma
 *                       address: Kathmandu, Nepal
 *                       gender: Male
 *                       contact: 9800000000
 *                       dob: 1995-06-15T00:00:00.000Z
 *                       teacher_email: teacher@example.com
 *                       schoolId: 680cf4d5e6e79f54ea8e8c99
 *                       userId: 680cf4d5e6e79f54ea8e8c99
 *                       status: active
 *                       qualification: M.Ed. in Mathematics
 *                       joinDate: 2024-01-01T00:00:00.000Z
 *                       createdAt: 2026-04-01T12:00:00.000Z
 *                       updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: No teachers found
 *                 value:
 *                   success: true
 *                   message: Teachers not found
 *                   data: []
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: School context missing
 *
 * /api/v1/teacher/{id}:
 *   get:
 *     summary: Get a teacher by id
 *     tags:
 *       - Teacher
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
 *         description: Teacher retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherResponse'
 *             examples:
 *               found:
 *                 summary: Found teacher
 *                 value:
 *                   success: true
 *                   message: Teacher retrieved successfully
 *                   data:
 *                     _id: 680cf4d5e6e79f54ea8e8c99
 *                     employeeId: T-SKS-RS-3A2F
 *                     teacherName: Ram Sharma
 *                     address: Kathmandu, Nepal
 *                     gender: Male
 *                     contact: 9800000000
 *                     dob: 1995-06-15T00:00:00.000Z
 *                     teacher_email: teacher@example.com
 *                     schoolId: 680cf4d5e6e79f54ea8e8c99
 *                     userId: 680cf4d5e6e79f54ea8e8c99
 *                     status: active
 *                     qualification: M.Ed. in Mathematics
 *                     joinDate: 2024-01-01T00:00:00.000Z
 *                     createdAt: 2026-04-01T12:00:00.000Z
 *                     updatedAt: 2026-04-27T10:45:00.000Z
 *               notFound:
 *                 summary: Teacher not found
 *                 value:
 *                   success: true
 *                   message: Teacher not found
 *                   data: {}
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   put:
 *     summary: Update a teacher
 *     tags:
 *       - Teacher
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
 *             $ref: '#/components/schemas/TeacherUpdateInput'
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherResponse'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Teacher not found
 *   delete:
 *     summary: Permanently delete a teacher
 *     tags:
 *       - Teacher
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
 *         description: Teacher permanently deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Teacher not found
 */
const teacherRouter = Router();

teacherRouter.post('/', authenticate, authorize([Role.OADMIN]), createTeacher);
teacherRouter.get('/', authenticate, authorize([Role.OADMIN]), getAllTeachers);
teacherRouter.get('/:id', authenticate, authorize([Role.OADMIN]), getTeacherById);
teacherRouter.put('/:id', authenticate, authorize([Role.OADMIN]), updateTeacher);
teacherRouter.delete('/:id', authenticate, authorize([Role.OADMIN]), hardDeleteTeacher);

export default teacherRouter;
