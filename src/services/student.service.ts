import { Types } from "mongoose";
import { Student } from "../models/student.model";
import { IStudentInput } from "../validators/student.validator";

//create
export const createStudent=async(data:IStudentInput)=>{
    return await Student.create(data);
}

//get all
export const getAllStudents=async()=>{
    return await Student.find().limit(20).sort({createdAt:-1});
}

export const getAllStudentsBySchool=async(schoolId:string)=>{
    return await Student.find({school_id:schoolId}).limit(20).sort({createdAt:-1});
}

//getById
export const getStudentById=async(id:string)=>{
    return await Student.findById(id);
}

//update
export const updateStudent=async(id:string,data:IStudentInput)=>{
    return await Student.findByIdAndUpdate(id,data,{returnDocument:'after',runValidators: true});
}

export const updateStudentBySchool=async(id:string,schoolId:string,data:IStudentInput)=>{
    return await Student.findOneAndUpdate({_id:id,school_id:schoolId},data,{returnDocument:'after',runValidators: true});
}

//hard delete
export const hardDeleteStudent=async(id:string)=>{
    return await Student.findByIdAndDelete(id);
}

export const hardDeleteStudentBySchool=async(id:string,schoolId:string)=>{
    return await Student.findOneAndDelete({_id:id,school_id:schoolId});
}