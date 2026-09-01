import { Types } from "mongoose";
import { School } from "../models/school.model";
import { Student } from "../models/student.model";
import { Teacher } from "../models/teacher.model";
import { Admin } from "../models/admin.model";
import { Accountant } from "../models/accountant.model";
import { Librarian } from "../models/librarian.model";
import { ClassModel } from "../models/class.model";
import { SectionModel } from "../models/section.model";
import { SubjectModel } from "../models/subject.model";
import { Book } from "../models/book.model";
import { AcademicYear } from "../models/academic-year.model";
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
        .sort({ createdAt: -1 })
        .populate('owner_id', '-password -refresh_token')
        .lean();
}

// get by id — populate owner so frontend gets name + profileImage & attach school stats
export const getSchoolById = async (id: string) => {
    const school = await School.findById(id)
        .populate('owner_id', '-password -refresh_token')
        .lean();

    if (!school) return null;

    try {
        const [
            studentsCount,
            teachersCount,
            adminsCount,
            accountantsCount,
            librariansCount,
            classesCount,
            sectionsCount,
            subjectsCount,
            booksCount,
            currentAcademicYear,
        ] = await Promise.all([
            Student.countDocuments({ schoolId: id, deletedAt: null }),
            Teacher.countDocuments({ schoolId: id, deletedAt: null }),
            Admin.countDocuments({ schoolId: id, deletedAt: null }),
            Accountant.countDocuments({ schoolId: id, deletedAt: null }),
            Librarian.countDocuments({ schoolId: id, deletedAt: null }),
            ClassModel.countDocuments({ schoolId: id }),
            SectionModel.countDocuments({ schoolId: id }),
            SubjectModel.countDocuments({ schoolId: id }),
            Book.countDocuments({ schoolId: id }),
            AcademicYear.findOne({ schoolId: id, isCurrent: true }).lean(),
        ]);

        return {
            ...school,
            stats: {
                studentsCount,
                teachersCount,
                adminsCount,
                accountantsCount,
                librariansCount,
                totalStaff: teachersCount + adminsCount + accountantsCount + librariansCount,
                classesCount,
                sectionsCount,
                subjectsCount,
                booksCount,
                activeAcademicYear: currentAcademicYear ? currentAcademicYear.name : null,
            },
        };
    } catch (err) {
        console.error("Error calculating school stats:", err);
        return school;
    }
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
    }).populate('owner_id', '-password -refresh_token').lean();
}

// hard delete
export const hardDeleteSchool = async (id: string) => {
    return await School.findByIdAndDelete(id);
}