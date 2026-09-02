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
    return await Parent.find()
        .populate('userId', 'name email profileImage role is_active').sort({ createdAt: -1 });
};

export const getAllParentsBySchool = async (schoolId: string) => {
    const studentRecords = await Student.find({ schoolId }).select('parentId').lean();
    const parentIds = studentRecords.map(s => s.parentId).filter(Boolean);
    return await Parent.find({ _id: { $in: parentIds } })
        .populate('userId', 'name email profileImage role is_active')
        .sort({ createdAt: -1 });
};

export const getParentById = async (id: string) => {
    return await Parent.findById(id)
        .populate('userId', 'name email profileImage role is_active');
};

export const getParentBySchool = async (id: string, schoolId: string) => {
    const parent = await Parent.findById(id).lean();
    if (!parent) return null;
    const student = await Student.findOne({ parentId: id, schoolId });
    if (!student) return null;
    return await Parent.findById(id)
        .populate('userId', 'name email profileImage role is_active');
};

export const updateParent = async (id: string, data: IParentInput) => {
    return await Parent.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
};

export const updateParentBySchool = async (id: string, schoolId: string, data: Partial<IParentInput>) => {
    const parent = await Parent.findById(id).lean();
    if (!parent) return null;
    const student = await Student.findOne({ parentId: id, schoolId });
    if (!student) return null;
    return await Parent.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
        .populate('userId', 'name email profileImage role is_active');
};

export const hardDeleteParent = async (id: string) => {
    return await Parent.findByIdAndDelete(id);
};

export const hardDeleteParentBySchool = async (id: string, schoolId: string) => {
    const parent = await Parent.findById(id).lean();
    if (!parent) return null;
    const student = await Student.findOne({ parentId: id, schoolId });
    if (!student) return null;
    return await Parent.findByIdAndDelete(id);
};

export const getParentByStudentId = async (studentId: string) => {
    const student = await Student.findById(studentId).select('parentId').lean();
    if (!student || !student.parentId) return null;
    return await Parent.findById(student.parentId)
        .populate('userId', 'name email profileImage role is_active');
};

export const getStudentByParentId = async (parentId: string) => {
    return await Student.findOne({ parentId })
        .populate('userId', 'name email profileImage role is_active');
};
