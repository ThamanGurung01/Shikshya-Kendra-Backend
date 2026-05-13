import { Types } from "mongoose";
import {School } from "../models/school.model";
import { ISchoolInput } from "../validators/school.validator";
import { generateUniqueSlug } from "../utils/slug.util";

//create
export const createSchool=async(data:ISchoolInput)=>{
    const slug = await generateUniqueSlug(School, data.school_name || '');
    return await School.create({ ...data, slug });
}
//get all
export const getAllSchools=async()=>{
    return await School.find().limit(20).sort({createdAt:-1});
}
//get by id
export const getSchoolById=async(id:string)=>{
    return await School.findById(id);
}
//update
export const updateSchool=async(id:string,data:ISchoolInput)=>{
    const updateData: any = { ...data };
    if (data.school_name) {
        updateData.slug = await generateUniqueSlug(School, data.school_name, id);
    }
    return await School.findByIdAndUpdate(id, updateData, {returnDocument:'after',runValidators: true});
}
// hard delete
export const hardDeleteSchool=async(id:string)=>{
    return await School.findByIdAndDelete(id);
}