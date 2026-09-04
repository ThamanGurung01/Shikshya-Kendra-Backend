import { Types } from "mongoose";
import { Student } from "../models/student.model";
import { IStudentInput } from "../validators/student.validator";

const userSelect = 'name email profileImage role is_active';
const schoolSelect = 'school_name logo address contact city _id';

//create
export const createStudent=async(data:IStudentInput,others:Record<string,unknown>={}, session?: any)=>{
    const cleanOthers = Object.fromEntries(
        Object.entries(others).filter(([_, v]) => v !== undefined)
    );
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    const [student] = await Student.create([{...cleanData,...cleanOthers}], { session });
    return student!;
}

//get all
export const getAllStudents=async()=>{
    return await Student.find()
        .populate({
            path:'parentId',
            populate:{path:'userId',select:userSelect}
        })
        .populate('schoolId',schoolSelect)
        .populate('userId',userSelect).sort({createdAt:-1});
}

export const getAllStudentsBySchool=async(schoolId:string)=>{
    return await Student.find({schoolId})
        .populate({
            path:'parentId',
            populate:{path:'userId',select:userSelect}
        })
        .populate('schoolId',schoolSelect)
        .populate('userId',userSelect).sort({createdAt:-1});
}

//getById
export const getStudentById=async(id:string)=>{
    return await Student.findById(id)
        .populate({
            path:'parentId',
            populate:{path:'userId',select:userSelect}
        })
        .populate('schoolId',schoolSelect)
        .populate('userId',userSelect);
}

// Returns just schoolId for ownership checks (unpopulated)
export const getStudentSchoolId = async (id: string) => {
    return await Student.findById(id).select('schoolId').lean();
}

// Returns raw ObjectId refs without population (userId, parentId, schoolId)
export const getStudentRawIds = async (id: string) => {
    return await Student.findById(id).select('userId parentId schoolId').lean();
}

//update
export const updateStudent=async(id:string,data:IStudentInput)=>{
    return await Student.findByIdAndUpdate(id,data,{returnDocument:'after',runValidators: true});
}

export const updateStudentBySchool=async(id:string,schoolId:string,data:IStudentInput)=>{
    return await Student.findOneAndUpdate({_id:id,schoolId},data,{returnDocument:'after',runValidators: true});
}

//hard delete
export const hardDeleteStudent=async(id:string)=>{
    return await Student.findByIdAndDelete(id);
}

export const hardDeleteStudentBySchool=async(id:string,schoolId:string)=>{
    return await Student.findOneAndDelete({_id:id,schoolId});
}

export const getStudentByUserId = async (userId: string) => {
    return await Student.findOne({ userId })
        .populate({
            path: 'parentId',
            populate: { path: 'userId', select: userSelect }
        })
        .populate('schoolId', schoolSelect)
        .populate('userId', userSelect);
}