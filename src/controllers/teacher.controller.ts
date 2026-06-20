import { Response } from 'express';
import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import * as teacherService from '../services/teacher.service';
import * as userService from '../services/user.service';
import * as schoolService from '../services/school.service';
import { zodError } from '../utils/zod-error.util';
import { teacherCreate, teacherUpdate } from '../validators/teacher.validator';
import { IUserInput } from '../validators/user.validator';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { generateUserEmail } from '../utils/email.util';

export const createTeacher = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = teacherCreate.safeParse({ ...req.body, schoolId });
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;

    const school = await schoolService.getSchoolById(schoolId);
    if (!school) return sendError(res, 'Associated school not found', undefined, 404);

    const generatedEmail = await generateUserEmail(parsedData.name, school.school_name);
    const defaultPassword = process.env.DEFAULT_PASSWORD || 'password123';
    const hashedPassword = await hashPassword(defaultPassword);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await userService.createUser(
        {
          name: parsedData.name,
          email: generatedEmail,
          password: hashedPassword,
          role: 'teacher',
          ...(parsedData.profileImage && { profileImage: parsedData.profileImage }),
          is_active: true,
        },
        session,
      );

      const schoolAcronym =
        school.school_name
          ?.split(/\s+/)
          .map((w: string) => w[0]?.toUpperCase())
          .join('') || 'XX';
      const nameParts = parsedData.name.trim().split(/\s+/);
      const initials = nameParts.map((w: string) => w[0]?.toUpperCase()).join('');
      const random = crypto.randomBytes(2).toString('hex').toUpperCase();
      const employeeId = `T-${schoolAcronym}-${initials}-${random}`;

      const teacher = await teacherService.createTeacher(
        {
          teacherName: parsedData.name,
          employeeId,
          address: parsedData.address,
          gender: parsedData.gender,
          contact: parsedData.contact,
          dob: parsedData.dob,
          ...(parsedData.teacher_email ? { teacher_email: parsedData.teacher_email } : {}),
          schoolId: schoolId.toString(),
          userId: user._id.toString(),
          status: parsedData.status,
          ...(parsedData.qualification && { qualification: parsedData.qualification }),
          ...(parsedData.joinDate && { joinDate: parsedData.joinDate }),
        },
        {},
        session,
      );

      await session.commitTransaction();
      return sendSuccess(
        res,
        'Teacher created successfully',
        {
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          profileImage: user.profileImage,
          employeeId: teacher.employeeId,
          teacherName: teacher.teacherName,
          address: teacher.address,
          gender: teacher.gender,
          contact: teacher.contact,
          teacher_email: teacher.teacher_email,
          status: teacher.status,
          qualification: teacher.qualification,
          joinDate: teacher.joinDate,
        },
        201,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getAllTeachers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const teachers = await teacherService.getAllTeachersBySchool(req.schoolId);
    if (teachers.length === 0) return sendSuccess(res, 'Teachers not found', [], 200);
    sendSuccess(res, 'Teachers retrieved successfully', teachers, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getTeacherById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const teacher = await teacherService.getTeacherById(id);
    if (!teacher) return sendSuccess(res, 'Teacher not found', {}, 200);
    if (teacher.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    sendSuccess(res, 'Teacher retrieved successfully', teacher, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateTeacher = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentTeacher = await teacherService.getTeacherById(id);
    if (!currentTeacher) return sendError(res, 'Teacher not found', undefined, 404);
    if (currentTeacher.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const parsed = teacherUpdate.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;

    const userUpdateData: Partial<IUserInput> = {};
    if (parsedData.name !== undefined) userUpdateData.name = parsedData.name;
    else if (parsedData.teacherName !== undefined) userUpdateData.name = parsedData.teacherName;
    if (parsedData.profileImage !== undefined) userUpdateData.profileImage = parsedData.profileImage;
    if (parsedData.is_active !== undefined) userUpdateData.is_active = parsedData.is_active;
    if (parsedData.password) {
      userUpdateData.password = await hashPassword(parsedData.password);
    }
    if (Object.keys(userUpdateData).length > 0) {
      await userService.updateUser(currentTeacher.userId.toString(), userUpdateData);
    }

    const teacherFields: Record<string, unknown> = {};
    if (parsedData.address !== undefined) teacherFields.address = parsedData.address;
    if (parsedData.gender !== undefined) teacherFields.gender = parsedData.gender;
    if (parsedData.contact !== undefined) teacherFields.contact = parsedData.contact;
    if (parsedData.dob !== undefined) teacherFields.dob = parsedData.dob;
    if (parsedData.teacher_email !== undefined) teacherFields.teacher_email = parsedData.teacher_email;
    if (parsedData.status !== undefined) teacherFields.status = parsedData.status;
    if (parsedData.teacherName !== undefined) teacherFields.teacherName = parsedData.teacherName;
    if (parsedData.qualification !== undefined) teacherFields.qualification = parsedData.qualification;
    if (parsedData.joinDate !== undefined) teacherFields.joinDate = parsedData.joinDate;
    if (parsedData.name !== undefined) teacherFields.teacherName = parsedData.name;

    let teacher;
    if (Object.keys(teacherFields).length > 0) {
      teacher = await teacherService.updateTeacherBySchool(id, req.schoolId, teacherFields as any);
      if (!teacher) return sendError(res, 'Teacher not found', undefined, 404);
    } else {
      teacher = currentTeacher;
    }

    sendSuccess(res, 'Teacher updated successfully', teacher, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const hardDeleteTeacher = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentTeacher = await teacherService.getTeacherById(id);
    if (!currentTeacher) return sendError(res, 'Teacher not found', undefined, 404);
    if (currentTeacher.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const teacher = await teacherService.hardDeleteTeacherBySchool(id, req.schoolId);
    if (!teacher) return sendError(res, 'Teacher not found', undefined, 404);

    const user = await userService.hardDeleteUser(teacher.userId.toString());
    if (!user) return sendError(res, 'Associated user not found', undefined, 404);

    sendSuccess(res, 'Teacher permanently deleted successfully', teacher, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};
