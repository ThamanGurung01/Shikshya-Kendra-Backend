import { Response } from 'express';
import * as parentService from '../services/parent.service';
import * as userService from '../services/user.service';
import * as schoolService from '../services/school.service';
import { zodError } from '../utils/zod-error.util';
import { ParentSchema, IParentInput } from '../validators/parent.validator';
import mongoose, { Types } from 'mongoose';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { generateUserEmail } from '../utils/email.util';

export const createParent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.userId) return sendError(res, "Unauthorized", undefined, 401);
        if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
        const schoolId = resolveSchoolId(req);
        if (!schoolId) return sendError(res, 'School ID is required', undefined, 400);

        const parsed = ParentSchema.safeParse(req.body);
        if (!parsed.success) {
            const tree = zodError(parsed.error);
            return sendError(res, "Validation failed", tree, 400);
        }
        const parsedData = parsed.data;

        const school = await schoolService.getSchoolById(schoolId);
        if (!school) return sendError(res, 'Associated school not found', undefined, 404);

        const parentName = parsedData.fatherName || parsedData.motherName || parsedData.guardianName || "Parent";
        const generatedEmail = parsedData.primarygurdianemail || await generateUserEmail(parentName, school.school_name);
        const defaultPassword = process.env.DEFAULT_PASSWORD || 'password123';
        const hashedPassword = await hashPassword(defaultPassword);

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const user = await userService.createUser({
                name: parentName,
                email: generatedEmail,
                password: hashedPassword,
                role: "parent",
                is_active: true,
            }, session);

            const parent = await parentService.createParent({
                ...parsedData,
                primarygurdianemail: generatedEmail,
            }, { userId: user._id.toString() }, session);

            await session.commitTransaction();
            return sendSuccess(res, "Parent created successfully", {
                _id: parent._id,
                fatherName: parent.fatherName,
                fatherPhone: parent.fatherPhone,
                motherName: parent.motherName,
                motherPhone: parent.motherPhone,
                guardianName: parent.guardianName,
                guardianPhone: parent.guardianPhone,
                relation: parent.relation,
                primarygurdianemail: parent.primarygurdianemail,
                userEmail: user.email,
                userName: user.name,
            }, 201);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error(error);
        sendError(res, "Internal Server Error", undefined, 500);
    }
};

export const getAllParents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);
        const parents = await parentService.getAllParentsBySchool(req.schoolId);
        if (parents.length === 0) return sendSuccess(res, "Parents not found", [], 200);
        sendSuccess(res, "Parents retrieved successfully", parents, 200);
    } catch (error) {
        console.error(error);
        sendError(res, "Internal Server Error", undefined, 500);
    }
};

export const getParentById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) return sendError(res, "ID is required", undefined, 400);
        if (!Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);
        if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

        const parent = await parentService.getParentBySchool(id, req.schoolId);
        if (!parent) return sendSuccess(res, "Parent not found", {}, 200);
        sendSuccess(res, "Parent retrieved successfully", parent, 200);
    } catch (error) {
        console.error(error);
        sendError(res, "Internal Server Error", undefined, 500);
    }
};

export const updateParent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) return sendError(res, "ID is required", undefined, 400);
        if (!Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);
        if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

        const parsed = ParentSchema.safeParse(req.body);
        if (!parsed.success) {
            const tree = zodError(parsed.error);
            return sendError(res, "Validation failed", tree, 400);
        }
        const parsedData = parsed.data;

        const updatedParent = await parentService.updateParentBySchool(id, req.schoolId, parsedData);
        if (!updatedParent) return sendError(res, "Parent not found", undefined, 404);

        const newName = parsedData.fatherName || parsedData.motherName || parsedData.guardianName;
        if (newName) {
            await userService.updateUser(updatedParent.userId.toString(), { name: newName });
        }

        sendSuccess(res, "Parent updated successfully", updatedParent, 200);
    } catch (error) {
        console.error(error);
        sendError(res, "Internal Server Error", undefined, 500);
    }
};

export const hardDeleteParent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || Array.isArray(id)) return sendError(res, "ID is required", undefined, 400);
        if (!Types.ObjectId.isValid(id)) return sendError(res, "Invalid ID format", undefined, 400);
        if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

        const parent = await parentService.hardDeleteParentBySchool(id, req.schoolId);
        if (!parent) return sendError(res, "Parent not found", undefined, 404);

        const user = await userService.hardDeleteUser(parent.userId.toString());
        if (!user) return sendError(res, "Associated user not found", undefined, 404);

        sendSuccess(res, "Parent permanently deleted successfully", parent, 200);
    } catch (error) {
        console.error(error);
        sendError(res, "Internal Server Error", undefined, 500);
    }
};
