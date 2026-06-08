import { Request, Response } from 'express';
import * as studentService from '../services/student.service';
import * as userService from '../services/user.service';
import { studentCreate } from '../validators/student.validator';
import { zodError } from '../validators/student.validator';
import { IUserInput } from '../validators/user.validator';
import { Types } from 'mongoose';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
//create student
export const createStudent=async(req:AuthenticatedRequest,res:Response)=>{
try{
    if(!req.userId) return sendError(res,"Unauthorized",undefined,401);
    if(!req.schoolId) return sendError(res,'School context missing',undefined,403);
    //validation using zod
    const parsed=studentCreate.safeParse({...req.body, school_id: req.schoolId});
    console.log("Parsed data:", parsed);
    if(!parsed.success) {
  const tree=zodError(parsed.error);
    return sendError(res,"Validation failed",tree,400);}
    const parsedStudentData=parsed.data;
    //check for duplicate email
    const existingUser=await userService.getUserByEmail(parsedStudentData.email,req.userId);
    if(existingUser) {
        return sendError(res,"Email already exists",undefined,409);
    }
    
    const hashedPassword=await hashPassword(parsedStudentData.password);
    const user=await userService.createUser({
        name:parsedStudentData.name,
        email:parsedStudentData.email,
        password:hashedPassword,
        role:"student",
        ...(parsedStudentData.profileImage && {profileImage:parsedStudentData.profileImage}),
        is_active:true
    });
    const student=await studentService.createStudent({...parsedStudentData, user_id:user._id});
    return sendSuccess(res,"Student created successfully",{
        name:user.name,
        email:user.email,
        role:user.role,
        is_active:user.is_active,
        profileImage:user.profileImage,
        address:student.address,
        contact:student.contact,
        student_email:student.student_email,
    },201);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}
}
//get all students
export const getAllStudents=async(req:AuthenticatedRequest,res:Response)=>{
try{
    if(!req.schoolId) return sendError(res,'School context missing',undefined,403);
    const students=await studentService.getAllStudentsBySchool(req.schoolId);
    if(students.length===0) return sendSuccess(res,"Student not found",[],200);
    sendSuccess(res, "Students retrieved successfully", students, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}
//get student by id
export const getStudentById=async(req:Request,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return sendError(res,"ID is required",undefined,400);
    if (!Types.ObjectId.isValid(id)) {
    return sendError(res,"Invalid ID format",undefined,400);
    }
    const student=await studentService.getStudentById(id);
    if(!student) return sendSuccess(res,"Student not found",{},200);
    sendSuccess(res, "Student retrieved successfully", student, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}
//update student
export const updateStudent=async(req:AuthenticatedRequest,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return sendError(res,"ID is required",undefined,400);
    if (!Types.ObjectId.isValid(id)) {
    return sendError(res,"Invalid ID format",undefined,400);
    }
        if(!req.schoolId) return sendError(res,'School context missing',undefined,403);
        const currentStudent=await studentService.getStudentById(id);
        if(!currentStudent) return sendError(res,'Student not found',undefined,404);
        if(currentStudent.school_id.toString() !== req.schoolId) return sendError(res,'Forbidden',undefined,403);

        const parsed=studentCreate.safeParse({...req.body, school_id: req.schoolId});
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return sendError(res,"Validation failed",tree,400);}
    const parsedData=parsed.data;
    
    // Check for duplicate email if email is being updated
    if(parsedData.email) {
        const existingUser=await userService.getUserByEmail(parsedData.email,currentStudent.user_id.toString());
        if(existingUser) {
            return sendError(res,"Email already exists",undefined,409);
        }
    }
    const userUpdateData: Partial<IUserInput> = {};
    if(parsedData.name) userUpdateData.name = parsedData.name;
    if(parsedData.profileImage) userUpdateData.profileImage = parsedData.profileImage;
    if(parsedData.password) {
        userUpdateData.password = await hashPassword(parsedData.password);
    }
    if(Object.keys(userUpdateData).length > 0) {
        await userService.updateUser(currentStudent.user_id.toString(), userUpdateData);
    }
    const student=await studentService.updateStudentBySchool(id,req.schoolId,parsedData);
    if(!student) return sendError(res,"Student not found",undefined,404);
    sendSuccess(res, "Student updated successfully", student, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}
//hard delete student
export const hardDeleteStudent=async(req:AuthenticatedRequest,res:Response)=>{
try{
    const {id}=req.params;
    if(!id || Array.isArray(id)) return sendError(res,"ID is required",undefined,400);
    if (!Types.ObjectId.isValid(id)) {
    return sendError(res,"Invalid ID format",undefined,400);
    }
    if(!req.schoolId) return sendError(res,'School context missing',undefined,403);
    const currentStudent=await studentService.getStudentById(id);
    if(!currentStudent) return sendError(res,'Student not found',undefined,404);
    if(currentStudent.school_id.toString() !== req.schoolId) return sendError(res,'Forbidden',undefined,403);

    const student=await studentService.hardDeleteStudentBySchool(id,req.schoolId);
    if(!student) return sendError(res,"Student not found",undefined,404);
    const user=await userService.hardDeleteUser(student.user_id.toString());
    if(!user) return sendError(res,"Associated user not found",undefined,404);
    sendSuccess(res, "Student permanently deleted successfully", student, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}