import { Types } from "mongoose";
import {School } from "../models/school.model";
import { ISchoolInput } from "../validators/school.validator";
//create
export const createSchool=async(data:ISchoolInput)=>{
    return await School.create(data);
}
//get all
export const getAllSchools=async()=>{
    return await School.find();
}
//get by id
export const getSchoolById=async(id:string)=>{
    return await School.findById(id);
}
//update
export const updateSchool=async(id:string,data:ISchoolInput)=>{
    return await School.findByIdAndUpdate(id,data,{new:true});
}
// soft delete
export const deleteSchool=async(id:string)=>{
    return await School.findByIdAndUpdate(id,{deletedAt:new Date()},{new:true});
}
// restore
export const restoreSchool=async(id:string)=>{
    return await School.findByIdAndUpdate(id,{deletedAt:null},{new:true});
}
// hard delete
export const hardDeleteSchool=async(id:string)=>{
    return await School.findByIdAndDelete(id);
}