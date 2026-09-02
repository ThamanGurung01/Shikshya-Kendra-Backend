import { Response } from 'express';
import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import * as adminService from '../services/admin.service';
import * as userService from '../services/user.service';
import * as schoolService from '../services/school.service';
import { zodError } from '../utils/zod-error.util';
import { adminCreate, adminUpdate } from '../validators/admin.validator';
import { IUserInput } from '../validators/user.validator';
import { hashPassword } from '../utils/hash.util';
import { User } from '../models/user.model';
import Role from '../utils/role.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { generateUserEmail } from '../utils/email.util';

export const createAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const schoolId = resolveSchoolId(req);
    if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

    const parsed = adminCreate.safeParse({ ...req.body, schoolId });
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
          role: 'admin',
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
      const employeeId = `AD-${schoolAcronym}-${initials}-${random}`;

      const admin = await adminService.createAdmin(
        {
          adminName: parsedData.name,
          employeeId,
          address: parsedData.address,
          gender: parsedData.gender,
          contact: parsedData.contact,
          dob: parsedData.dob,
          ...(parsedData.admin_email ? { admin_email: parsedData.admin_email } : {}),
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
        'Admin created successfully',
        {
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          profileImage: user.profileImage,
          employeeId: admin.employeeId,
          adminName: admin.adminName,
          address: admin.address,
          gender: admin.gender,
          contact: admin.contact,
          admin_email: admin.admin_email,
          status: admin.status,
          qualification: admin.qualification,
          joinDate: admin.joinDate,
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

export const getAllAdmins = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
    const admins = await adminService.getAllAdminsBySchool(req.schoolId);
    if (admins.length === 0) return sendSuccess(res, 'Admins not found', [], 200);
    sendSuccess(res, 'Admins retrieved successfully', admins, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const getAdminById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const admin = await adminService.getAdminById(id);
    if (!admin) return sendSuccess(res, 'Admin not found', {}, 200);
    if (admin.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    sendSuccess(res, 'Admin retrieved successfully', admin, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const updateAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentAdmin = await adminService.getAdminById(id);
    if (!currentAdmin) return sendError(res, 'Admin not found', undefined, 404);
    if (currentAdmin.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const parsed = adminUpdate.safeParse(req.body);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;

    const userUpdateData: Partial<IUserInput> = {};
    if (parsedData.name !== undefined) userUpdateData.name = parsedData.name;
    else if (parsedData.adminName !== undefined) userUpdateData.name = parsedData.adminName;
    if (parsedData.profileImage !== undefined) userUpdateData.profileImage = parsedData.profileImage;
    if (parsedData.is_active !== undefined) userUpdateData.is_active = parsedData.is_active;
    if (parsedData.password) {
      userUpdateData.password = await hashPassword(parsedData.password);
    }
    if (Object.keys(userUpdateData).length > 0) {
      await userService.updateUser(currentAdmin.populated('userId').toString(), userUpdateData);
    }

    const adminFields: Record<string, unknown> = {};
    if (parsedData.address !== undefined) adminFields.address = parsedData.address;
    if (parsedData.gender !== undefined) adminFields.gender = parsedData.gender;
    if (parsedData.contact !== undefined) adminFields.contact = parsedData.contact;
    if (parsedData.dob !== undefined) adminFields.dob = parsedData.dob;
    if (parsedData.admin_email !== undefined) adminFields.admin_email = parsedData.admin_email;
    if (parsedData.status !== undefined) adminFields.status = parsedData.status;
    if (parsedData.adminName !== undefined) adminFields.adminName = parsedData.adminName;
    if (parsedData.qualification !== undefined) adminFields.qualification = parsedData.qualification;
    if (parsedData.joinDate !== undefined) adminFields.joinDate = parsedData.joinDate;
    if (parsedData.name !== undefined) adminFields.adminName = parsedData.name;

    let admin;
    if (Object.keys(adminFields).length > 0) {
      admin = await adminService.updateAdminBySchool(id, req.schoolId, adminFields as any);
      if (!admin) return sendError(res, 'Admin not found', undefined, 404);
    } else {
      admin = currentAdmin;
    }

    sendSuccess(res, 'Admin updated successfully', admin, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const hardDeleteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) return sendError(res, 'Invalid ID format', undefined, 400);
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const currentAdmin = await adminService.getAdminById(id);
    if (!currentAdmin) return sendError(res, 'Admin not found', undefined, 404);
    if (currentAdmin.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const admin = await adminService.hardDeleteAdminBySchool(id, req.schoolId);
    if (!admin) return sendError(res, 'Admin not found', undefined, 404);

    const user = await userService.hardDeleteUser(admin.userId.toString());
    if (!user) return sendError(res, 'Associated user not found', undefined, 404);

    sendSuccess(res, 'Admin permanently deleted successfully', admin, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

export const resetUserPassword = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { targetUserId, newPassword } = req.body;

    if (!targetUserId || !Types.ObjectId.isValid(targetUserId)) {
      return sendError(res, 'Invalid or missing user ID', undefined, 400);
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return sendError(res, 'Password must be at least 6 characters long', undefined, 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return sendError(res, 'Target user not found', undefined, 404);
    }

    // 1. Superadmin password cannot be reset via admin route.
    if (targetUser.role === Role.SUPERADMIN) {
      return sendError(res, 'Password reset is not allowed for superadmin.', undefined, 403);
    }

    // 2. If target is School Owner (OADMIN): ONLY Superadmin can reset password.
    if (targetUser.role === Role.OADMIN) {
      if (req.role !== Role.SUPERADMIN) {
        return sendError(res, 'Only Superadmin can reset password for School Owner (OAdmin).', undefined, 403);
      }
    }

    // 3. If target is Academic Admin (ADMIN): ONLY School Owner (OADMIN) or Superadmin can reset password.
    if (targetUser.role === Role.ADMIN) {
      if (req.role !== Role.OADMIN && req.role !== Role.SUPERADMIN) {
        return sendError(res, 'Only the School Owner (OAdmin) can reset password for other administrators.', undefined, 403);
      }
    }

    // Hash new password & clear refresh token
    const hashedPassword = await hashPassword(newPassword.trim());
    targetUser.password = hashedPassword;
    targetUser.refresh_token = '';
    await targetUser.save();

    return sendSuccess(res, `Password reset successfully for ${targetUser.name}`, {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
    });
  } catch (error: any) {
    console.error('Error resetting user password:', error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

