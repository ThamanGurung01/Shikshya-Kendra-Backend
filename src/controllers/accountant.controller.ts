import { Response } from 'express';
import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import * as accountantService from '../services/accountant.service';
import * as userService from '../services/user.service';
import * as schoolService from '../services/school.service';
import { zodError } from '../utils/zod-error.util';
import { accountantCreate, accountantUpdate } from '../validators/accountant.validator';
import { IUserInput } from '../validators/user.validator';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { generateUserEmail } from '../utils/email.util';

export const createAccountant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = accountantCreate.safeParse({ ...req.body, schoolId });
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
          role: 'accountant',
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
      const employeeId = `A-${schoolAcronym}-${initials}-${random}`;

      const accountant = await accountantService.createAccountant(
        {
          accountantName: parsedData.name,
          employeeId,
          address: parsedData.address,
          gender: parsedData.gender,
          contact: parsedData.contact,
          dob: parsedData.dob,
          ...(parsedData.accountant_email ? { accountant_email: parsedData.accountant_email } : {}),
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
        'Accountant created successfully',
        {
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          profileImage: user.profileImage,
          employeeId: accountant.employeeId,
          accountantName: accountant.accountantName,
          address: accountant.address,
          gender: accountant.gender,
          contact: accountant.contact,
          accountant_email: accountant.accountant_email,
          status: accountant.status,
          qualification: accountant.qualification,
          joinDate: accountant.joinDate,
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

export const getAllAccountants = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const accountants = await accountantService.getAllAccountantsBySchool(req.schoolId);
    if (accountants.length === 0) return sendSuccess(res, 'Accountants not found', [], 200);
    sendSuccess(res, 'Accountants retrieved successfully', accountants, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getAccountantById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const accountant = await accountantService.getAccountantById(id);
    if (!accountant) return sendSuccess(res, 'Accountant not found', {}, 200);
    if (accountant.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    sendSuccess(res, 'Accountant retrieved successfully', accountant, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateAccountant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentAccountant = await accountantService.getAccountantById(id);
    if (!currentAccountant) return sendError(res, 'Accountant not found', undefined, 404);
    if (currentAccountant.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const parsed = accountantUpdate.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;

    const userUpdateData: Partial<IUserInput> = {};
    if (parsedData.name !== undefined) userUpdateData.name = parsedData.name;
    else if (parsedData.accountantName !== undefined) userUpdateData.name = parsedData.accountantName;
    if (parsedData.profileImage !== undefined) userUpdateData.profileImage = parsedData.profileImage;
    if (parsedData.is_active !== undefined) userUpdateData.is_active = parsedData.is_active;
    if (parsedData.password) {
      userUpdateData.password = await hashPassword(parsedData.password);
    }
    if (Object.keys(userUpdateData).length > 0) {
      await userService.updateUser(currentAccountant.populated('userId').toString(), userUpdateData);
    }

    const accountantFields: Record<string, unknown> = {};
    if (parsedData.address !== undefined) accountantFields.address = parsedData.address;
    if (parsedData.gender !== undefined) accountantFields.gender = parsedData.gender;
    if (parsedData.contact !== undefined) accountantFields.contact = parsedData.contact;
    if (parsedData.dob !== undefined) accountantFields.dob = parsedData.dob;
    if (parsedData.accountant_email !== undefined) accountantFields.accountant_email = parsedData.accountant_email;
    if (parsedData.status !== undefined) accountantFields.status = parsedData.status;
    if (parsedData.accountantName !== undefined) accountantFields.accountantName = parsedData.accountantName;
    if (parsedData.qualification !== undefined) accountantFields.qualification = parsedData.qualification;
    if (parsedData.joinDate !== undefined) accountantFields.joinDate = parsedData.joinDate;
    if (parsedData.name !== undefined) accountantFields.accountantName = parsedData.name;

    let accountant;
    if (Object.keys(accountantFields).length > 0) {
      accountant = await accountantService.updateAccountantBySchool(id, req.schoolId, accountantFields as any);
      if (!accountant) return sendError(res, 'Accountant not found', undefined, 404);
    } else {
      accountant = currentAccountant;
    }

    sendSuccess(res, 'Accountant updated successfully', accountant, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const hardDeleteAccountant = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentAccountant = await accountantService.getAccountantById(id);
    if (!currentAccountant) return sendError(res, 'Accountant not found', undefined, 404);
    if (currentAccountant.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const accountant = await accountantService.hardDeleteAccountantBySchool(id, req.schoolId);
    if (!accountant) return sendError(res, 'Accountant not found', undefined, 404);

    const user = await userService.hardDeleteUser(accountant.userId.toString());
    if (!user) return sendError(res, 'Associated user not found', undefined, 404);

    sendSuccess(res, 'Accountant permanently deleted successfully', accountant, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};
