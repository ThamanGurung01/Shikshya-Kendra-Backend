import { Request, Response } from 'express';
import * as studentService from '../services/student.service';
import * as userService from '../services/user.service';
import * as enrollmentService from '../services/student-enrollment.service';
import * as schoolService from '../services/school.service';
import * as parentService from '../services/parent.service';
import { zodError } from '../utils/zod-error.util';
import {  studentFullSchema, studentUpdate } from '../validators/student.validator';
import mongoose, { Types } from 'mongoose';
import crypto from 'crypto';
import { hashPassword } from '../utils/hash.util';
import { sendError, sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { resolveSchoolId } from '../utils/resolve-school-id.util';
import { IUserInput } from '../validators/user.validator';
import { generateUserEmail } from '../utils/email.util';
import { IParentInput, ParentSchema } from '../validators/parent.validator';
import { Parent } from '../models/parent.model';
import { User } from '../models/user.model';
import { Student } from '../models/student.model';

// ─── Helpers ────────────────────────────────────────────────────────────────
interface UploadedFiles {
  profileImage?: Express.Multer.File[];
  photo?: Express.Multer.File[];
  birthCertificate?: Express.Multer.File[];
  transferCertificate?: Express.Multer.File[];
  previousMarksheet?: Express.Multer.File[];
  citizenshipOrId?: Express.Multer.File[];
}

function extractFileUrls(req: Request) {
  const files = (req.files ?? {}) as UploadedFiles;
  return {
    profileImageUrl: (files.profileImage?.[0] as any)?.path as string | undefined,
    photoUrl: (files.photo?.[0] as any)?.path as string | undefined,
    birthCertificateUrl: (files.birthCertificate?.[0] as any)?.path as string | undefined,
    transferCertificateUrl: (files.transferCertificate?.[0] as any)?.path as string | undefined,
    previousMarksheetUrl: (files.previousMarksheet?.[0] as any)?.path as string | undefined,
    citizenshipOrIdUrl: (files.citizenshipOrId?.[0] as any)?.path as string | undefined,
  };
}

function buildDocuments(
  body: any,
  photoUrl?: string,
  birthCertificateUrl?: string,
  transferCertificateUrl?: string,
  previousMarksheetUrl?: string,
  citizenshipOrIdUrl?: string,
) {
  const hasAnyFile = photoUrl || birthCertificateUrl || transferCertificateUrl || previousMarksheetUrl || citizenshipOrIdUrl;
  const hasAnyBody = body.photoUrl || body.birthCertificateUrl || body.transferCertificateUrl || body.previousMarksheetUrl || body.citizenshipOrIdUrl;
  if (!hasAnyFile && !hasAnyBody) return undefined;

  return {
    ...(photoUrl ? { photoUrl } : body.photoUrl ? { photoUrl: body.photoUrl } : {}),
    ...(birthCertificateUrl ? { birthCertificateUrl } : body.birthCertificateUrl ? { birthCertificateUrl: body.birthCertificateUrl } : {}),
    ...(transferCertificateUrl ? { transferCertificateUrl } : body.transferCertificateUrl ? { transferCertificateUrl: body.transferCertificateUrl } : {}),
    ...(previousMarksheetUrl ? { previousMarksheetUrl } : body.previousMarksheetUrl ? { previousMarksheetUrl: body.previousMarksheetUrl } : {}),
    ...(citizenshipOrIdUrl ? { citizenshipOrIdUrl } : body.citizenshipOrIdUrl ? { citizenshipOrIdUrl: body.citizenshipOrIdUrl } : {}),
  };
}

//create student
export const createStudent=async(req:AuthenticatedRequest,res:Response)=>{
try{
    if(!req.userId) return sendError(res,"Unauthorized",undefined,401);
    if(!req.schoolId) return sendError(res,'School context missing',undefined,403);
    const schoolId=resolveSchoolId(req);
    if(!schoolId) return sendError(res,'School ID is required',undefined,400);

    const {
      profileImageUrl, photoUrl, birthCertificateUrl,
      transferCertificateUrl, previousMarksheetUrl, citizenshipOrIdUrl,
    } = extractFileUrls(req);

    const bodyForValidation = {
      ...req.body,
      ...(profileImageUrl && { profileImage: profileImageUrl }),
      ...(photoUrl || birthCertificateUrl || transferCertificateUrl || previousMarksheetUrl || citizenshipOrIdUrl
        ? { documents: buildDocuments(req.body, photoUrl, birthCertificateUrl, transferCertificateUrl, previousMarksheetUrl, citizenshipOrIdUrl) }
        : {}),
      schoolId,
    };

    const parentId=bodyForValidation.parentId;
    let parsedParentData;
    if(!parentId){
        parsedParentData=ParentSchema.safeParse(bodyForValidation);
        if(!parsedParentData.success){
            const tree=zodError(parsedParentData.error);
            return sendError(res,"Validation failed",tree,400);
        }
    }
    //validation using zod
    const parsed=studentFullSchema.safeParse(bodyForValidation);
    if(!parsed.success) {
  const tree=zodError(parsed.error);
    return sendError(res,"Validation failed",tree,400);}
    const parsedStudentData=parsed.data;
    const school=await schoolService.getSchoolById(schoolId);
    if(!school) return sendError(res,'Associated school not found',undefined,404);
    // Auto-generate emails
    const generatedEmail = await generateUserEmail(parsedStudentData.name,school.school_name);
    const defaultPassword = process.env.DEFAULT_PASSWORD || 'password123';
    const hashedPassword=await hashPassword(defaultPassword);
    const session=await mongoose.startSession();
    session.startTransaction();
    try{
        let parent;
        if(!parentId){
            if(!parsedParentData||!parsedParentData.data) return sendError(res,"Parent data is required when parentId is not provided",undefined,400);
            const parentsData=parsedParentData.data;
            const parentName=parentsData.fatherName || parentsData.motherName || parentsData.guardianName || "Parent";
            const parentUserEmail=await generateUserEmail(parentName,school.school_name);
            const parentUser=await userService.createUser({
            name:parentName,
            email:parentUserEmail,
            password:hashedPassword,
            role:"parent",
            is_active:true
        });
            parent= await parentService.createParent({
                ...parentsData,
                userId:parentUser._id.toString(),
            },{},session);
            if(!parent) return sendError(res,"Parent creation failed",undefined,500);
        }
        const user=await userService.createUser({
            name:parsedStudentData.name,
            email:generatedEmail,
            password:hashedPassword,
            role:"student",
            ...(parsedStudentData.profileImage && {profileImage:parsedStudentData.profileImage}),
            is_active:true
        },session);
        const schoolAcronym=school.school_name
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
            ...(parentId ? {parentId:parentId} : {parentId:parent?._id}),
            schoolId:schoolId.toString(),
            userId:user._id.toString(),
            status:parsedStudentData.status,
            ...(parsedStudentData.documents && {documents: parsedStudentData.documents}),
            ...(parsedStudentData.healthInfo && {healthInfo: parsedStudentData.healthInfo}),
        },{},session);
        const enrollmentStatus = parsedStudentData.status || "active";
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
        if(enrollmentStatus==="active") enrollmentData.joinedAt=new Date();
        if(["dropped","graduated","transferred"].includes(enrollmentStatus)){
            enrollmentData.leftAt=new Date();
        }
        const createdEnrollment = await enrollmentService.createStudentEnrollment(enrollmentData,session);
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
            enrollment:createdEnrollment,
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

    // Attach enrollment data to each student
    const studentIds = students.map(s => (s._id as Types.ObjectId).toString());
    const enrollments = await enrollmentService.getStudentEnrollmentsByStudentIds(studentIds);
    const enrollmentsMap = new Map<string, any[]>();
    enrollments.forEach(e => {
      const sId = e.studentId.toString();
      if (!enrollmentsMap.has(sId)) {
        enrollmentsMap.set(sId, []);
      }
      enrollmentsMap.get(sId)!.push(e);
    });

    const studentsWithEnrollment = students.map(s => {
        const data: Record<string, unknown> = s.toObject() as unknown as Record<string, unknown>;
        const sId = (s._id as Types.ObjectId).toString();
        const studentEnrollments = enrollmentsMap.get(sId) || [];
        const activeEnrollment = studentEnrollments.find(e => e.studentEnrollmentStatus === 'active') || studentEnrollments[0];
        if (activeEnrollment) data.enrollment = activeEnrollment;
        data.enrollments = studentEnrollments;
        return data;
    });
    sendSuccess(res, "Students retrieved successfully", studentsWithEnrollment, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}

//get student by id
export const getStudentById=async(req:AuthenticatedRequest,res:Response)=>{
try{
    let {id}=req.params;
    if(!id || Array.isArray(id)) return sendError(res,"ID is required",undefined,400);

    let student;
    if (id === 'me') {
        if (!req.userId) return sendError(res,"Unauthorized",undefined,401);
        student = await studentService.getStudentByUserId(req.userId);
    } else {
        if (!Types.ObjectId.isValid(id)) {
            return sendError(res,"Invalid ID format",undefined,400);
        }
        student = await studentService.getStudentById(id);
    }

    if(!student) return sendSuccess(res,"Student not found",{},200);
    const studentData: Record<string, unknown> = student.toObject() as unknown as Record<string, unknown>;

    // Fetch enrollments with populated academic year, class, and section
    const sId = (student._id as Types.ObjectId).toString();
    const enrollments = await enrollmentService.getStudentEnrollmentsByStudentIds([sId]);
    const activeEnrollment = enrollments.find(e => e.studentEnrollmentStatus === 'active') || enrollments[0];
    if(activeEnrollment) {
        studentData.enrollment = activeEnrollment;
    }
    studentData.enrollments = enrollments;
    sendSuccess(res, "Student retrieved successfully", studentData, 200);
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
        const ownership=await studentService.getStudentSchoolId(id);
        if(!ownership) return sendError(res,'Student not found',undefined,404);
        if(ownership.schoolId.toString() !== req.schoolId) return sendError(res,'Forbidden',undefined,403);
        const rawIds=await studentService.getStudentRawIds(id);
        if(!rawIds) return sendError(res,'Student not found',undefined,404);
        const currentStudent=await studentService.getStudentById(id);
        if(!currentStudent) return sendError(res,'Student not found',undefined,404);

        const {
          profileImageUrl, photoUrl, birthCertificateUrl,
          transferCertificateUrl, previousMarksheetUrl, citizenshipOrIdUrl,
        } = extractFileUrls(req);
        const bodyForValidation = {
          ...req.body,
          ...(profileImageUrl && { profileImage: profileImageUrl }),
          ...(photoUrl || birthCertificateUrl || transferCertificateUrl || previousMarksheetUrl || citizenshipOrIdUrl
            ? { documents: buildDocuments(req.body, photoUrl, birthCertificateUrl, transferCertificateUrl, previousMarksheetUrl, citizenshipOrIdUrl) }
            : {}),
        };
        const parsed=studentUpdate.safeParse(bodyForValidation);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return sendError(res,"Validation failed",tree,400);}
    const parsedData=parsed.data;
    // Update user fields
    const userUpdateData: Partial<IUserInput> = {};
    if(parsedData.name !== undefined) userUpdateData.name = parsedData.name;
    if(parsedData.is_active !== undefined) userUpdateData.is_active = parsedData.is_active;
    if(parsedData.password) {
        userUpdateData.password = await hashPassword(parsedData.password);
    }

    const effectivePhoto = parsedData.profileImage || parsedData.documents?.photoUrl;
    if (effectivePhoto) {
      userUpdateData.profileImage = effectivePhoto;
    }

    if(Object.keys(userUpdateData).length > 0) {
        await userService.updateUser(rawIds.userId.toString(), userUpdateData);
    }
    // Update student fields only
    const studentFields: Record<string, unknown> = {};
    if(parsedData.address !== undefined) studentFields.address = parsedData.address;
    if(parsedData.gender !== undefined) studentFields.gender = parsedData.gender;
    if(parsedData.contact !== undefined) studentFields.contact = parsedData.contact;
    if(parsedData.dob !== undefined) studentFields.dob = parsedData.dob;
    if(parsedData.student_email !== undefined) studentFields.student_email = parsedData.student_email;
    if(parsedData.status !== undefined) studentFields.status = parsedData.status;
    if(parsedData.studentName !== undefined) studentFields.studentName = parsedData.studentName;
    if(parsedData.parentId !== undefined) studentFields.parentId = parsedData.parentId;
    if(parsedData.documents !== undefined) studentFields.documents = parsedData.documents;
    if(effectivePhoto) {
      studentFields["documents.photoUrl"] = effectivePhoto;
    }
    if(parsedData.healthInfo !== undefined) studentFields.healthInfo = parsedData.healthInfo;
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
    // Sync enrollment status from student status
    if(parsedData.status !== undefined) {
        enrollmentFields.studentEnrollmentStatus = parsedData.status;
        if(parsedData.status==="active") enrollmentFields.joinedAt=new Date();
        if(["dropped","graduated","transferred"].includes(parsedData.status)){
            enrollmentFields.leftAt=new Date();
        }
    }
    if(Object.keys(enrollmentFields).length > 0) {
        const enrollment=await enrollmentService.getStudentEnrollmentByStudentId(id);
        if(enrollment) {
            await enrollmentService.updateStudentEnrollment(enrollment._id.toString(),req.schoolId,enrollmentFields as any);
        }
    }
    // Update parent fields if provided
    const parentFieldKeys=['fatherName','fatherPhone','motherName','motherPhone','guardianName','guardianPhone','relation','primarygurdianemail'];
    const parentUpdateData: Record<string, unknown> = {};
    let hasParentData=false;
    for (const key of parentFieldKeys) {
        if ((req.body as any)[key] !== undefined) {
            parentUpdateData[key] = (req.body as any)[key];
            hasParentData=true;
        }
    }
    if(hasParentData) {
        if(!rawIds.parentId) return sendError(res,'Student has no associated parent',undefined,400);
        const updatedParent = await parentService.updateParent(rawIds.parentId.toString(), parentUpdateData as any);
        if(!updatedParent) return sendError(res,"Parent not found",undefined,404);
        const parentName = parentUpdateData.fatherName || parentUpdateData.motherName || parentUpdateData.guardianName;
        if(parentName) {
            await userService.updateUser(updatedParent.userId.toString(), { name: parentName as string });
        }
    }
    // Re-fetch populated student data with enrollment for the response
    const updatedStudent = await studentService.getStudentById(id);
    const updatedStudentData: Record<string, unknown> = updatedStudent
        ? (updatedStudent.toObject() as unknown as Record<string, unknown>)
        : (student.toObject() as unknown as Record<string, unknown>);
    const updatedEnrollment = await enrollmentService.getStudentEnrollmentByStudentId(id);
    if (updatedEnrollment) updatedStudentData.enrollment = updatedEnrollment;
    sendSuccess(res, "Student updated successfully", updatedStudentData, 200);
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
    const ownership=await studentService.getStudentSchoolId(id);
    if(!ownership) return sendError(res,'Student not found',undefined,404);
    if(ownership.schoolId.toString() !== req.schoolId) return sendError(res,'Forbidden',undefined,403);

    const student=await studentService.hardDeleteStudentBySchool(id,req.schoolId);
    if(!student) return sendError(res,"Student not found",undefined,404);
    const user=await userService.hardDeleteUser(student.userId.toString());
    if(!user) return sendError(res,"Associated user not found",undefined,404);
    const enrollement=await enrollmentService.hardDeleteStudentEnrollment(student._id.toString(),req.schoolId);
     if(!enrollement) return sendError(res,"Associated enrollment not found",undefined,404);
    sendSuccess(res, "Student permanently deleted successfully", student, 200);
}catch(error){
    console.error(error);
sendError(res,"Internal Server Error",undefined,500);
}}

// update student profile image (Admin/OAdmin only)
export const updateStudentImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || Array.isArray(id)) return sendError(res, "ID is required", undefined, 400);
    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid ID format", undefined, 400);
    }
    if (!req.schoolId) return sendError(res, 'School context missing', undefined, 403);

    const ownership = await studentService.getStudentSchoolId(id);
    if (!ownership) return sendError(res, 'Student not found', undefined, 404);
    if (ownership.schoolId.toString() !== req.schoolId) return sendError(res, 'Forbidden', undefined, 403);

    const rawIds = await studentService.getStudentRawIds(id);
    if (!rawIds) return sendError(res, 'Student not found', undefined, 404);

    const files = (req.files ?? {}) as { [fieldname: string]: Express.Multer.File[] };
    const uploadedFile = files.profileImage?.[0] || files.photo?.[0] || files.file?.[0] || files.image?.[0] || (req.file as any);
    const imageUrl = (uploadedFile as any)?.path || req.body?.profileImage || req.body?.imageUrl;

    if (!imageUrl) {
      return sendError(res, "No image file or URL provided", undefined, 400);
    }

    // Update user's profileImage
    await User.findByIdAndUpdate(rawIds.userId, { $set: { profileImage: imageUrl } }, { new: true });

    // Update student's photoUrl in documents
    const updatedStudent = await Student.findOneAndUpdate(
      { _id: id, schoolId: req.schoolId },
      { $set: { "documents.photoUrl": imageUrl } },
      { new: true, runValidators: true }
    );

    sendSuccess(res, "Student profile image updated successfully", {
      profileImage: imageUrl,
      student: updatedStudent,
    }, 200);
  } catch (error) {
    console.error("Update student image error:", error);
    sendError(res, "Internal Server Error", undefined, 500);
  }
};
