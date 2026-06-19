import { Request, Response } from 'express';
import * as schoolService from '../services/school.service';
import * as userService from '../services/user.service';
import { zodError } from '../utils/zod-error.util';
import { schoolCreate, schoolUpdate } from '../validators/school.validator';
import { IUserInput } from '../validators/user.validator';
import { Types } from 'mongoose';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { generateUserEmail } from '../utils/email.util';

// ─── Helpers ────────────────────────────────────────────────────────────────
interface UploadedFiles {
  panCertificate?: Express.Multer.File[];
  registrationCertificate?: Express.Multer.File[];
  profileImage?: Express.Multer.File[];
}

/** Extract Cloudinary URLs from multer-storage-cloudinary result */
function extractFileUrls(req: Request) {
  const files = (req.files ?? {}) as UploadedFiles;
  return {
    panUrl: (files.panCertificate?.[0] as any)?.path as string | undefined,
    regUrl: (files.registrationCertificate?.[0] as any)?.path as string | undefined,
    profileImageUrl: (files.profileImage?.[0] as any)?.path as string | undefined,
  };
}

/** Build the `documents` field from uploaded file URLs + body fields.
 *  Falls back to whatever was already in the body (for edit without re-upload). */
function buildDocuments(body: any, panUrl?: string, regUrl?: string) {
  const panValue = panUrl ?? body.pan_value;
  const regValue = regUrl ?? body.registration_certificate;
  const panType = body.pan_type ?? (panUrl ? 'image' : undefined);

  if (!panValue && !regValue) return undefined;

  return {
    ...(panValue && { panCertificate: { type: panType ?? 'image', value: panValue } }),
    ...(regValue && { registrationCertificate: regValue }),
  };
}

// ─── Create School ───────────────────────────────────────────────────────────
export const createSchool = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  let createdUserId: Types.ObjectId | null = null;
  try {
    const { panUrl, regUrl, profileImageUrl } = extractFileUrls(req);

    // Merge body with file-resolved fields so the validator sees a unified object
    const bodyForValidation = {
      ...req.body,
      ...(profileImageUrl && { profileImage: profileImageUrl }),
      ...(panUrl || regUrl
        ? {
            documents: buildDocuments(req.body, panUrl, regUrl),
          }
        : {}),
    };

    const parsed = schoolCreate.safeParse(bodyForValidation);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;

    // Auto-generate email
      const generatedEmail = await generateUserEmail(parsedData.name, parsedData.school_name);

    const defaultPassword = process.env.DEFAULT_PASSWORD || 'password123';
    const hashedPassword = await hashPassword(defaultPassword);

    // ── Create user first, then school. Roll back user if school fails. ──────
    const user = await userService.createUser({
      name: parsedData.name,
      email: generatedEmail,
      password: hashedPassword,
      role: 'oadmin',
      ...(parsedData.profileImage && { profileImage: parsedData.profileImage }),
      is_active: true,
    });
    createdUserId = user._id as Types.ObjectId;

    // If school creation fails, the catch block deletes the user (rollback)
    const school = await schoolService.createSchool({
      ...parsedData,
      verifiedAt: new Date(),
    },{
            owner_id: user._id,
    });

    return sendSuccess(
      res,
      'OAdmin for school created successfully',
      {
        slug: school.slug,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        profileImage: user.profileImage,
        school_name: school.school_name,
        address: school.address,
        contact: school.contact,
        school_email: school.school_email,
        website: school.website,
        map: school.map,
        city: school.city,
        country: school.country,
        documents: school.documents,
        verifiedAt: school.verifiedAt,
      },
      201,
    );
  } catch (error) {
    // Rollback: delete the user if it was created but school creation failed
    if (createdUserId) {
      const user=await userService.hardDeleteUser(createdUserId.toString());
      if(!user){
        console.error('Rollback failed — orphaned user:', createdUserId);
      }
    }
    console.error(error);
    return sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Get All Schools ─────────────────────────────────────────────────────────
export const getAllSchools = async (_: Request, res: Response) => {
  try {
    const schools = await schoolService.getAllSchools();
    if (schools.length === 0) return sendSuccess(res, 'School not found', [], 200);
    sendSuccess(res, 'Schools retrieved successfully', schools, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Get School By ID ────────────────────────────────────────────────────────
export const getSchoolById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const school = await schoolService.getSchoolById(id);
    if (!school) return sendSuccess(res, 'School not found', {}, 200);
    sendSuccess(res, 'School retrieved successfully', school, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Update School ───────────────────────────────────────────────────────────
export const updateSchool = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) return sendError(res, 'Unauthorized', undefined, 401);
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }

    const { panUrl, regUrl, profileImageUrl } = extractFileUrls(req);

    const bodyForValidation = {
      ...req.body,
      ...(profileImageUrl && { profileImage: profileImageUrl }),
      ...(panUrl || regUrl
        ? { documents: buildDocuments(req.body, panUrl, regUrl) }
        : {}),
    };

    // ── Use the UPDATE schema (all fields optional, no required name/email/password)
    const parsed = schoolUpdate.safeParse(bodyForValidation);
    if (!parsed.success) {
      const tree = zodError(parsed.error);
      console.error('Update validation failed:', JSON.stringify(tree, null, 2));
      return sendError(res, 'Validation failed', tree, 400);
    }
    const parsedData = parsed.data;

    // Get current school to find owner_id
    const currentSchool = await schoolService.getSchoolById(id);
    if (!currentSchool) return sendError(res, 'School not found', undefined, 404);

    // Superadmin can update any school without owner check
    if (req.role !== 'superadmin') {
      console.log('Current school owner_id:', currentSchool.owner_id._id.toString(), 'Requesting userId:', req.userId);
      if (currentSchool.owner_id._id.toString() !== req.userId) {
        return sendError(res, 'Forbidden: You do not own this school', undefined, 403);
      }
    }
    // Update linked user (only fields that were actually provided)
    const userUpdateData: Partial<IUserInput> = {};
    if (parsedData.name) userUpdateData.name = parsedData.name;
    if (parsedData.profileImage) userUpdateData.profileImage = parsedData.profileImage;
    if (parsedData.password) {
      userUpdateData.password = await hashPassword(parsedData.password);
    }
    if (Object.keys(userUpdateData).length > 0) {
      await userService.updateUser(currentSchool.owner_id._id.toString(), userUpdateData);
    }

    const school = await schoolService.updateSchool(id, parsedData);
    if (!school) return sendError(res, 'School not found', undefined, 404);
    sendSuccess(res, 'School updated successfully', school, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};

// ─── Hard Delete School ──────────────────────────────────────────────────────
export const hardDeleteSchool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, 'ID is required', undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid ID format', undefined, 400);
    }
    const school = await schoolService.hardDeleteSchool(id);
    if (!school) return sendError(res, 'School not found', undefined, 404);
    sendSuccess(res, 'School permanently deleted successfully', school, 200);
  } catch (error) {
    console.error(error);
    sendError(res, 'Internal Server Error', undefined, 500);
  }
};