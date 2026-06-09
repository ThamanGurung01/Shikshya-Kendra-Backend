import { AcademicYear } from "../models/academic-year.model";
import { IAcademicYearInput } from "../validators/academic-year.validator";

// create
export const createAcademicYear = async (data: IAcademicYearInput,others:Object={}) => {
    return await AcademicYear.create({ ...data,...others });
}

// get all — no user population needed for list view
export const getAllAcademicYears = async (schoolId: string) => {
    return await AcademicYear.find({ schoolId })
        .limit(20)
        .sort({ createdAt: -1 })
        .lean();
}

// get by id — populate owner so frontend gets name + profileImage
export const getAcademicYearById = async (id: string) => {
    return await AcademicYear.findById(id)
        .lean();
}

export const updateAcademicYear = async (id: string, schoolId: string, data: IAcademicYearInput) => {
    return await AcademicYear.findOneAndUpdate({ _id: id, schoolId }, data, {
        returnDocument: 'after',
        runValidators: true,
    }).lean();
}

// hard delete
export const hardDeleteAcademicYear = async (id: string, schoolId: string) => {
    return await AcademicYear.findOneAndDelete({ _id: id, schoolId });
}