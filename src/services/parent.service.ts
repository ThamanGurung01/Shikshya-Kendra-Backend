import { Types } from "mongoose";
import { Parent } from "../models/parent.model";
import { Student } from "../models/student.model";
import { IParentInput } from "../validators/parent.validator";

export const createParent = async (data: IParentInput, others: Record<string, unknown> = {}, session?: any) => {
    const cleanOthers = Object.fromEntries(
        Object.entries(others).filter(([_, v]) => v !== undefined)
    );
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    const [parent] = await Parent.create([{ ...cleanData, ...cleanOthers }], { session });
    return parent!;
};

export const getAllParents = async () => {
    return await Parent.find().limit(20).sort({ createdAt: -1 }).populate('studentId');
};

export const getAllParentsBySchool = async (schoolId: string) => {
    const studentIds = (await Student.find({ schoolId }).select('_id').lean()).map(s => s._id);
    return await Parent.find({ studentId: { $in: studentIds } })
        .populate('studentId')
        .limit(20)
        .sort({ createdAt: -1 });
};

export const getParentById = async (id: string) => {
    return await Parent.findById(id).populate('studentId');
};

export const getParentBySchool = async (id: string, schoolId: string) => {
    const parent = await Parent.findById(id).lean();
    if (!parent) return null;
    const p = parent as unknown as { studentId: Types.ObjectId };
    const student = await Student.findById(p.studentId);
    if (!student || student.schoolId.toString() !== schoolId) return null;
    return await Parent.findById(id).populate('studentId');
};

export const updateParent = async (id: string, data: IParentInput) => {
    return await Parent.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};

export const updateParentBySchool = async (id: string, schoolId: string, data: IParentInput) => {
    const parent = await Parent.findById(id).lean();
    if (!parent) return null;
    const p = parent as unknown as { studentId: Types.ObjectId };
    const student = await Student.findById(p.studentId);
    if (!student || student.schoolId.toString() !== schoolId) return null;
    return await Parent.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};

export const hardDeleteParent = async (id: string) => {
    return await Parent.findByIdAndDelete(id);
};

export const hardDeleteParentBySchool = async (id: string, schoolId: string) => {
    const parent = await Parent.findById(id).lean();
    if (!parent) return null;
    const p = parent as unknown as { studentId: Types.ObjectId };
    const student = await Student.findById(p.studentId);
    if (!student || student.schoolId.toString() !== schoolId) return null;
    return await Parent.findByIdAndDelete(id);
};

export const getParentByStudentId = async (studentId: string) => {
    return await Parent.findOne({ studentId }).populate('studentId');
};

export const getStudentByParentId = async (parentId: string) => {
    const parent = await Parent.findById(parentId).lean();
    if (!parent) return null;
    const p = parent as unknown as { studentId: Types.ObjectId };
    return await Student.findById(p.studentId);
};
