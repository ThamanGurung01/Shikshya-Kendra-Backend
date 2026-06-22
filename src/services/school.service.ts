import { Types } from "mongoose";
import { School } from "../models/school.model";
import { ISchoolInput, ISchoolUpdate } from "../validators/school.validator";
import { generateUniqueSlug } from "../utils/slug.util";

// create
export const createSchool = async (data: ISchoolInput, others: Record<string, unknown> = {}) => {
    const slug = await generateUniqueSlug(School, data.school_name || '');
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    return await School.create({ ...cleanData, slug, ...others });
}

// get all — no user population needed for list view
export const getAllSchools = async () => {
    return await School.find()
        .limit(20)
        .sort({ createdAt: -1 })
        .populate('owner_id', 'name email profileImage role is_active -_id')
        .lean();
}

// get by id — populate owner so frontend gets name + profileImage
export const getSchoolById = async (id: string) => {
    return await School.findById(id)
        .populate('owner_id', 'name email profileImage role is_active -_id')
        .lean();
}

// update — accepts partial update type
export const updateSchool = async (id: string, data: ISchoolUpdate) => {
    const updateData: Record<string, unknown> = { ...data };
    if (data.school_name) {
        updateData.slug = await generateUniqueSlug(School, data.school_name, id);
    }
    return await School.findByIdAndUpdate(id, updateData, {
        returnDocument: 'after',
        runValidators: true,
    }).populate('owner_id', 'name email profileImage role is_active -_id').lean();
}

// hard delete
export const hardDeleteSchool = async (id: string) => {
    return await School.findByIdAndDelete(id);
}