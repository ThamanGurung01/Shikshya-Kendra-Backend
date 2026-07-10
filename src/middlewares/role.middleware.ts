import {Response,NextFunction} from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import * as userService from '../services/user.service';
import { sendError } from '../utils/response.util';
import { School } from '../models/school.model';
import { Admin } from '../models/admin.model';
import { Teacher } from '../models/teacher.model';
import { Student } from '../models/student.model';
import { Parent } from '../models/parent.model';
import { Accountant } from '../models/accountant.model';
import { Librarian } from '../models/librarian.model';

export const authorize=(allowedRoles:string[])=>{
    return async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
        const userId=req.userId;
        if(!userId) return sendError(res,"UnAuthenticated",undefined,401);
        const user=await userService.getUserById(userId);
        if(!user) return sendError(res,"UnAuthenticated",undefined,401);
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) return sendError(res,"Forbidden",undefined,403);
        req.role = user.role;
        if (user.role !== "superadmin") {
            let schoolId: string | undefined;
            if (user.role === "oadmin") {
                const schoolDoc = await School.findOne({ owner_id: userId }).select('_id').lean();
                if (schoolDoc) schoolId = schoolDoc._id.toString();
            } else if (user.role === "admin") {
                const adminDoc = await Admin.findOne({ userId }).select('schoolId').lean();
                if (adminDoc) schoolId = adminDoc.schoolId.toString();
            } else if (user.role === "teacher") {
                const teacherDoc = await Teacher.findOne({ userId }).select('schoolId').lean();
                if (teacherDoc) schoolId = teacherDoc.schoolId.toString();
            } else if (user.role === "student") {
                const studentDoc = await Student.findOne({ userId }).select('schoolId').lean();
                if (studentDoc) schoolId = studentDoc.schoolId.toString();
            } else if (user.role === "accountant") {
                const accountantDoc = await Accountant.findOne({ userId }).select('schoolId').lean();
                if (accountantDoc) schoolId = accountantDoc.schoolId.toString();
            } else if (user.role === "librarian") {
                const librarianDoc = await Librarian.findOne({ userId }).select('schoolId').lean();
                if (librarianDoc) schoolId = librarianDoc.schoolId.toString();
            } else if (user.role === "parent") {
                const parentDoc = await Parent.findOne({ userId }).select('_id').lean();
                if (parentDoc) {
                    const studentDoc = await Student.findOne({ parentId: parentDoc._id }).select('schoolId').lean();
                    if (studentDoc) schoolId = studentDoc.schoolId.toString();
                }
            }

            if (!schoolId) {
                return sendError(res, "Associated school not found", undefined, 404);
            }
            req.schoolId = schoolId;
        }
        next();
    }
}