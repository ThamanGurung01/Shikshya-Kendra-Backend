import { Request, Response } from 'express';
import * as schoolService from '../services/school.service';
import { schoolCreate } from '../validators/school.validator';
import { zodError } from '../validators/school.validator';
import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
//create school
export const createSchool=async(req:Request,res:Response)=>{
try{
    const parsed=schoolCreate.safeParse(req.body);
    if(!parsed.success) {
  const tree=zodError(parsed.error);
    return sendError(res,"Validation failed",tree,400);}
    const parsedSchoolData=parsed.data;
    const hashedPassword=await hashPassword(parsedSchoolData.password);
    const user=await User.create({
        name:parsedSchoolData.name,
        email:parsedSchoolData.email,
        password:hashedPassword,
        role:"oadmin",
        ...(parsedSchoolData.profileImage && {profileImage:parsedSchoolData.profileImage}),
        is_active:true
    });
    const school=await schoolService.createSchool({...parsedSchoolData,owner_id:user._id,verifiedAt:new Date()});
    return sendSuccess(res,"OAdmin for school created successfully",{
        slug:school.slug,
        name:user.name,
        email:user.email,
        role:user.role,
        is_active:user.is_active,
        profileImage:user.profileImage,
        school_name:school.school_name,
        address:school.address,
        contact:school.contact,
        school_email:school.school_email,
        website:school.website,
        map:school.map,
        city:school.city,
        country:school.country,
        documents:school.documents,
        verifiedAt:school.verifiedAt
    },201);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}
}
//get all schools
export const getAllSchools=async(_:Request,res:Response)=>{
try{
    const schools=await schoolService.getAllSchools();
    if(schools.length===0) return sendSuccess(res,"School not found",[],200);
    sendSuccess(res, "Schools retrieved successfully", schools, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}
//get school by id
export const getSchoolById=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return sendError(res,"ID is required",undefined,400);
    if (!Types.ObjectId.isValid(id)) {
    return sendError(res,"Invalid ID format",undefined,400);
    }
    const school=await schoolService.getSchoolById(id);
    if(!school) return sendSuccess(res,"School not found",{},200);
    sendSuccess(res, "School retrieved successfully", school, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}
//update school
export const updateSchool=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return sendError(res,"ID is required",undefined,400);
    if (!Types.ObjectId.isValid(id)) {
    return sendError(res,"Invalid ID format",undefined,400);
    }
        const parsed=schoolCreate.safeParse(req.body);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return sendError(res,"Validation failed",tree,400);}
    const parsedData=parsed.data;
    const school=await schoolService.updateSchool(id,parsedData);
    if(!school) return sendError(res,"School not found",undefined,404);
    sendSuccess(res, "School updated successfully", school, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}
//hard delete school
export const hardDeleteSchool=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return sendError(res,"ID is required",undefined,400);
    if (!Types.ObjectId.isValid(id)) {
    return sendError(res,"Invalid ID format",undefined,400);
    }
    const school=await schoolService.hardDeleteSchool(id);
    if(!school) return sendError(res,"School not found",undefined,404);
    sendSuccess(res, "School permanently deleted successfully", school, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}