import { Request, Response } from 'express';
import * as schoolService from '../services/school.service';
import { SchoolSchema } from '../validators/school.validator';
import { zodError } from '../validators/auth.validator';
//create school
export const createSchool=async(req:Request,res:Response)=>{
try{
    const parsed=SchoolSchema.safeParse(req.body);
    if(!parsed.success) {
  const tree=zodError(parsed.error);
  return res.status(400).json({success:false,errors:tree,message:"Validation failed"});}
    const parsedData=parsed.data;
    const school=await schoolService.createSchool(parsedData);
    res.status(201).json({ success: true, data: school, message: "School created successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}
}
//get all schools
export const getAllSchools=async(_:Request,res:Response)=>{
try{
    const schools=await schoolService.getAllSchools();
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
    const school=await schoolService.getSchoolById(id);
    if(!school) return res.status(404).json({success:false,message:"School not found"});
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
    const parsed=SchoolSchema.safeParse(req.body);
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
//soft delete school
export const deleteSchool=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return res.status(400).json({success:false,message:"ID is required"});
    const school=await schoolService.deleteSchool(id);
    if(!school) return res.status(404).json({success:false,message:"School not found"});
    res.status(200).json({ success: true, data: school, message: "School deleted successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}}
//restore school
export const restoreSchool=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return res.status(400).json({success:false,message:"ID is required"});
    const school=await schoolService.restoreSchool(id);
    if(!school) return res.status(404).json({success:false,message:"School not found"});
    res.status(200).json({ success: true, data: school, message: "School restored successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}}
//hard delete school
export const hardDeleteSchool=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return res.status(400).json({success:false,message:"ID is required"});
    const school=await schoolService.hardDeleteSchool(id);
    if(!school) return res.status(404).json({success:false,message:"School not found"});
    res.status(200).json({ success: true, data: school, message: "School permanently deleted successfully" });
}catch(error){
    console.error(error);
res.status(500).json({success:false,message:"Internal Server Error"});
}}