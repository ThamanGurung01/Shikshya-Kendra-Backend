import { Request, Response } from 'express';
import * as studentService from '../services/student.service';
import * as userService from '../services/user.service';
import * as enrollmentService from '../services/student-enrollment.service';
import * as schoolService from '../services/school.service';
import { zodError } from '../utils/zod-error.util';
import {  studentFullSchema, studentUpdate } from '../validators/student.validator';
import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { IUserInput } from '../validators/user.validator';
import {generateStudentEmail } from '../utils/email.util';
//create student
export const createStudent=async(req:AuthenticatedRequest,res:Response)=>{
try{
    if(!req.userId) return sendError(res,"Unauthorized",undefined,401);
    if(!req.schoolId) return sendError(res,'School context missing',undefined,403);
    const schoolId=resolveSchoolId(req);
    if(!schoolId) return sendError(res,'School ID is required',undefined,400);
    //validation using zod
    const parsed=studentFullSchema.safeParse({...req.body,schoolId});
    if(!parsed.success) {
  const tree=zodError(parsed.error);
    return sendError(res,"Validation failed",tree,400);}
    const parsedStudentData=parsed.data;
    const school=await schoolService.getSchoolById(schoolId);
    if(!school) return sendError(res,'Associated school not found',undefined,404);
    // Auto-generate email
    const generatedEmail = await generateStudentEmail(parsedStudentData.name,school.school_name);
    
    const defaultPassword = process.env.DEFAULT_PASSWORD || 'password123';
    const hashedPassword=await hashPassword(defaultPassword);
    const session=await mongoose.startSession();
    session.startTransaction();
    try{
        const user=await userService.createUser({
            name:parsedStudentData.name,
            email:generatedEmail,
            password:hashedPassword,
            role:"student",
            ...(parsedStudentData.profileImage && {profileImage:parsedStudentData.profileImage}),
            is_active:true
        },session);
        const school=await schoolService.getSchoolById(schoolId);
        const schoolAcronym=school?.school_name
            ?.split(/\s+/)
            .map((w:string)=>w[0]?.toUpperCase())
            .join("")||"XX";
        const nameParts=parsedStudentData.name.trim().split(/\s+/);
        const initials=nameParts.map((w:string)=>w[0]?.toUpperCase()).join("");
        const random=crypto.randomBytes(2).toString("hex").toUpperCase();
        const admissionNumber=`${schoolAcronym}-${initials}-${random}`;
        const student=await studentService.createStudent({
            studentName:parsedStudentData.name,
            admissionNumber,
            address:parsedStudentData.address,
            gender:parsedStudentData.gender,
            contact:parsedStudentData.contact,
            dob:parsedStudentData.dob,
            ...(parsedStudentData.student_email ? {student_email:parsedStudentData.student_email} : {}),
            schoolId:schoolId.toString(),
            userId:user._id.toString(),
            status:parsedStudentData.status
        },{},session);
        const enrollmentStatus=parsedStudentData.studentEnrollmentStatus||"pending";
        const enrollmentData: enrollmentService.CreateEnrollmentData = {
            studentId:student._id.toString(),
            schoolId:schoolId.toString(),
            academicYearId:parsedStudentData.academicYearId,
            classId:parsedStudentData.classId,
            sectionId:parsedStudentData.sectionId,
            ...(parsedStudentData.rollNumber && {rollNumber:parsedStudentData.rollNumber}),
            ...(parsedStudentData.promotedFromEnrollmentId && {promotedFromEnrollmentId:parsedStudentData.promotedFromEnrollmentId}),
            studentEnrollmentStatus:enrollmentStatus,
        };
        if(enrollmentStatus==="enrolled") enrollmentData.joinedAt=new Date();
        if(["dropped","completed","failed","withdrawn","cancelled"].includes(enrollmentStatus)){
            enrollmentData.leftAt=new Date();
        }
        await enrollmentService.createStudentEnrollment(enrollmentData,session);
        await session.commitTransaction();
        return sendSuccess(res,"Student created successfully",{
            name:user.name,
            email:user.email,
            role:user.role,
            is_active:user.is_active,
            profileImage:user.profileImage,
            admissionNumber:student.admissionNumber,
            address:student.address,
            contact:student.contact,
            student_email:student.student_email,
            studentName:student.studentName,
        },201);
    }catch(error){
        await session.abortTransaction();
        throw error;
    }finally{
        session.endSession();
    }
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
        if(currentStudent.schoolId.toString() !== req.schoolId) return sendError(res,'Forbidden',undefined,403);

        const parsed=studentUpdate.safeParse(req.body);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return sendError(res,"Validation failed",tree,400);}
    const parsedData=parsed.data;
    // Update user fields
    const userUpdateData: Partial<IUserInput> = {};
    if(parsedData.name !== undefined) userUpdateData.name = parsedData.name;
    if(parsedData.profileImage !== undefined) userUpdateData.profileImage = parsedData.profileImage;
    if(parsedData.is_active !== undefined) userUpdateData.is_active = parsedData.is_active;
    if(parsedData.password) {
        userUpdateData.password = await hashPassword(parsedData.password);
    }
    if(Object.keys(userUpdateData).length > 0) {
        await userService.updateUser(currentStudent.userId.toString(), userUpdateData);
    }
    // Update student fields only
    const studentFields: Record<string, unknown> = {};
    if(parsedData.address !== undefined) studentFields.address = parsedData.address;
    if(parsedData.gender !== undefined) studentFields.gender = parsedData.gender;
    if(parsedData.contact !== undefined) studentFields.contact = parsedData.contact;
    if(parsedData.dob !== undefined) studentFields.dob = parsedData.dob;
    if(parsedData.student_email !== undefined) studentFields.student_email = parsedData.student_email;
    if(parsedData.status !== undefined) studentFields.status = parsedData.status;
    let student;
    if(Object.keys(studentFields).length > 0) {
        student=await studentService.updateStudentBySchool(id,req.schoolId,studentFields as any);
        if(!student) return sendError(res,"Student not found",undefined,404);
    } else {
        student=currentStudent;
    }
    // Update enrollment fields
    const enrollmentFields: Record<string, unknown> = {};
    if(parsedData.academicYearId !== undefined) enrollmentFields.academicYearId = parsedData.academicYearId;
    if(parsedData.classId !== undefined) enrollmentFields.classId = parsedData.classId;
    if(parsedData.sectionId !== undefined) enrollmentFields.sectionId = parsedData.sectionId;
    if(parsedData.rollNumber !== undefined) enrollmentFields.rollNumber = parsedData.rollNumber;
    if(parsedData.promotedFromEnrollmentId !== undefined) enrollmentFields.promotedFromEnrollmentId = parsedData.promotedFromEnrollmentId;
    if(parsedData.studentEnrollmentStatus !== undefined) {
        enrollmentFields.studentEnrollmentStatus = parsedData.studentEnrollmentStatus;
        const status=parsedData.studentEnrollmentStatus;
        if(status==="enrolled") enrollmentFields.joinedAt=new Date();
        if(["dropped","completed","failed","withdrawn","cancelled"].includes(status)){
            enrollmentFields.leftAt=new Date();
        }
    }
    if(Object.keys(enrollmentFields).length > 0) {
        const enrollment=await enrollmentService.getStudentEnrollmentByStudentId(id);
        if(enrollment) {
            await enrollmentService.updateStudentEnrollment(enrollment._id.toString(),req.schoolId,enrollmentFields as any);
        }
    }
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
    if(currentStudent.schoolId.toString() !== req.schoolId) return sendError(res,'Forbidden',undefined,403);

    const student=await studentService.hardDeleteStudentBySchool(id,req.schoolId);
    if(!student) return sendError(res,"Student not found",undefined,404);
    const user=await userService.hardDeleteUser(student.userId.toString());
    if(!user) return sendError(res,"Associated user not found",undefined,404);
    sendSuccess(res, "Student permanently deleted successfully", student, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}