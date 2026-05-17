import { Request, Response } from 'express';
import * as schoolService from '../services/school.service';
import * as userService from '../services/user.service';
import { schoolCreate } from '../validators/school.validator';
import { zodError } from '../validators/school.validator';
import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
//create school
export const createSchool=async(req:AuthenticatedRequest,res:Response)=>{
try{
    if(!req.userId) return sendError(res,"Unauthorized",undefined,401);
    //validation using zod
    const parsed=schoolCreate.safeParse(req.body);
    if(!parsed.success) {
  const tree=zodError(parsed.error);
    return sendError(res,"Validation failed",tree,400);}
    const parsedSchoolData=parsed.data;
    //check for duplicate email
    const existingUser=await userService.getUserByEmail(parsedSchoolData.email,req.userId);
    if(existingUser) {
        return sendError(res,"Email already exists",undefined,409);
    }
    
    const hashedPassword=await hashPassword(parsedSchoolData.password);
    const user=await userService.createUser({
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
    
    // Get current school to find owner_id
    const currentSchool=await schoolService.getSchoolById(id);
    if(!currentSchool) return sendError(res,"School not found",undefined,404);

    const userUpdateData: any = {};
    if(parsedData.name) userUpdateData.name = parsedData.name;
    if(parsedData.profileImage) userUpdateData.profileImage = parsedData.profileImage;
    if(parsedData.password) {
        userUpdateData.password = await hashPassword(parsedData.password);
    }
    if(Object.keys(userUpdateData).length > 0) {
        await userService.updateUser(currentSchool._id.toString(), userUpdateData);
    }
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
    const user=await userService.hardDeleteUser(school._id.toString());
    if(!user) return sendError(res,"Associated user not found",undefined,404);
    sendSuccess(res, "School permanently deleted successfully", school, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}