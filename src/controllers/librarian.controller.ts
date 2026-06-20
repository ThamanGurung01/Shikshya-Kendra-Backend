import { Response } from 'express';
import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import * as librarianService from '../services/librarian.service';
import * as userService from '../services/user.service';
import * as schoolService from '../services/school.service';
import { zodError } from '../utils/zod-error.util';
import { librarianCreate, librarianUpdate } from '../validators/librarian.validator';
import { IUserInput } from '../validators/user.validator';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { generateUserEmail } from '../utils/email.util';

export const createLibrarian = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = librarianCreate.safeParse({ ...req.body, schoolId });
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
          role: 'librarian',
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
      const employeeId = `L-${schoolAcronym}-${initials}-${random}`;

      const librarian = await librarianService.createLibrarian(
        {
          librarianName: parsedData.name,
          employeeId,
          address: parsedData.address,
          gender: parsedData.gender,
          contact: parsedData.contact,
          dob: parsedData.dob,
          ...(parsedData.librarian_email ? { librarian_email: parsedData.librarian_email } : {}),
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
        'Librarian created successfully',
        {
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          profileImage: user.profileImage,
          employeeId: librarian.employeeId,
          librarianName: librarian.librarianName,
          address: librarian.address,
          gender: librarian.gender,
          contact: librarian.contact,
          librarian_email: librarian.librarian_email,
          status: librarian.status,
          qualification: librarian.qualification,
          joinDate: librarian.joinDate,
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

export const getAllLibrarians = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const librarians = await librarianService.getAllLibrariansBySchool(req.schoolId);
    if (librarians.length === 0) return sendSuccess(res, 'Librarians not found', [], 200);
    sendSuccess(res, 'Librarians retrieved successfully', librarians, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getLibrarianById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const librarian = await librarianService.getLibrarianById(id);
    if (!librarian) return sendSuccess(res, 'Librarian not found', {}, 200);
    if (librarian.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    sendSuccess(res, 'Librarian retrieved successfully', librarian, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateLibrarian = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentLibrarian = await librarianService.getLibrarianById(id);
    if (!currentLibrarian) return sendError(res, 'Librarian not found', undefined, 404);
    if (currentLibrarian.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const parsed = librarianUpdate.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;

    const userUpdateData: Partial<IUserInput> = {};
    if (parsedData.name !== undefined) userUpdateData.name = parsedData.name;
    else if (parsedData.librarianName !== undefined) userUpdateData.name = parsedData.librarianName;
    if (parsedData.profileImage !== undefined) userUpdateData.profileImage = parsedData.profileImage;
    if (parsedData.is_active !== undefined) userUpdateData.is_active = parsedData.is_active;
    if (parsedData.password) {
      userUpdateData.password = await hashPassword(parsedData.password);
    }
    if (Object.keys(userUpdateData).length > 0) {
      await userService.updateUser(currentLibrarian.userId.toString(), userUpdateData);
    }

    const librarianFields: Record<string, unknown> = {};
    if (parsedData.address !== undefined) librarianFields.address = parsedData.address;
    if (parsedData.gender !== undefined) librarianFields.gender = parsedData.gender;
    if (parsedData.contact !== undefined) librarianFields.contact = parsedData.contact;
    if (parsedData.dob !== undefined) librarianFields.dob = parsedData.dob;
    if (parsedData.librarian_email !== undefined) librarianFields.librarian_email = parsedData.librarian_email;
    if (parsedData.status !== undefined) librarianFields.status = parsedData.status;
    if (parsedData.librarianName !== undefined) librarianFields.librarianName = parsedData.librarianName;
    if (parsedData.qualification !== undefined) librarianFields.qualification = parsedData.qualification;
    if (parsedData.joinDate !== undefined) librarianFields.joinDate = parsedData.joinDate;
    if (parsedData.name !== undefined) librarianFields.librarianName = parsedData.name;

    let librarian;
    if (Object.keys(librarianFields).length > 0) {
      librarian = await librarianService.updateLibrarianBySchool(id, req.schoolId, librarianFields as any);
      if (!librarian) return sendError(res, 'Librarian not found', undefined, 404);
    } else {
      librarian = currentLibrarian;
    }

    sendSuccess(res, 'Librarian updated successfully', librarian, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const hardDeleteLibrarian = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentLibrarian = await librarianService.getLibrarianById(id);
    if (!currentLibrarian) return sendError(res, 'Librarian not found', undefined, 404);
    if (currentLibrarian.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const librarian = await librarianService.hardDeleteLibrarianBySchool(id, req.schoolId);
    if (!librarian) return sendError(res, 'Librarian not found', undefined, 404);

    const user = await userService.hardDeleteUser(librarian.userId.toString());
    if (!user) return sendError(res, 'Associated user not found', undefined, 404);

    sendSuccess(res, 'Librarian permanently deleted successfully', librarian, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};
