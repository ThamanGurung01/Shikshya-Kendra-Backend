import { Request, Response } from 'express';
import * as schoolService from '../services/school.service';
import { schoolCreate } from '../validators/school.validator';
import { zodError } from '../validators/school.validator';
import { Types } from 'mongoose';
import { User } from '../models/user.model';
import { hashPassword } from '../utils/hash.util';
//create school
export const createSchool=async(req:Request,res:Response)=>{
try{
    const parsed=schoolCreate.safeParse(req.body);
    if(!parsed.success) {
  const tree=zodError(parsed.error);
  return res.status(400).json({success:false,errors:tree,message:"Validation failed"});}
    const parsedSchoolData=parsed.data;
    const hashedPassword=await hashPassword(parsedSchoolData.password);
    const user=await User.create({
        name:parsedSchoolData.name,
        email:parsedSchoolData.email,
        password:hashedPassword,
        role:"oadmin",
        is_active:true
    });
    const school=await schoolService.createSchool({...parsedSchoolData,owner_id:user._id,verifiedAt:new Date()});
    res.status(201).json({ success: true, data: {
        name:user.name,
        email:user.email,
        role:user.role,
        is_active:user.is_active,
        school_name:school.school_name,
        address:school.address,
        contact:school.contact,
        school_email:school.school_email,
        website:school.website,
        verifiedAt:school.verifiedAt
    }, message: "OAdmin for school created successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}
}
//get all schools
export const getAllSchools=async(_:Request,res:Response)=>{
try{
    const schools=await schoolService.getAllSchools();
    if(schools.length===0) return res.status(200).json({success:true,data:[],message:"School not found"});
    res.status(200).json({ success: true, data: schools, message: "Schools retrieved successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}}
//get school by id
export const getSchoolById=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return res.status(400).json({success:false,message:"ID is required"});
    if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({success:false,message:"Invalid ID format"});
    }
    const school=await schoolService.getSchoolById(id);
    if(!school) return res.status(200).json({success:true,data:{},message:"School not found"});
    res.status(200).json({ success: true, data: school, message: "School retrieved successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}}
//update school
export const updateSchool=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return res.status(400).json({success:false,message:"ID is required"});
    if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({success:false,message:"Invalid ID format"});
    }
        const parsed=schoolCreate.safeParse(req.body);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return res.status(400).json({success:false,errors:tree,message:"Validation failed"});}
    const parsedData=parsed.data;
    const school=await schoolService.updateSchool(id,parsedData);
    if(!school) return res.status(404).json({success:false,message:"School not found"});
    res.status(200).json({ success: true, data: school, message: "School updated successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}}
//hard delete school
export const hardDeleteSchool=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return res.status(400).json({success:false,message:"ID is required"});
    if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({success:false,message:"Invalid ID format"});
    }
    const school=await schoolService.hardDeleteSchool(id);
    if(!school) return res.status(404).json({success:false,message:"School not found"});
    res.status(200).json({ success: true, data: school, message: "School permanently deleted successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}}