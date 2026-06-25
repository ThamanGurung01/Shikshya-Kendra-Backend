import {z} from 'zod';
import { userSchema } from './user.validator';
import { StudentEnrollmentSchema } from './student-enrollment.model';

const studentSchema=z.object({
    admissionNumber:z.string().optional(),
    address:z.string().min(5,"Address must be at least 5 characters long"),
    gender:z.string().min(1,"Gender is required"),
    contact:z.string().min(10,"Contact number must be at least 10 characters long").optional(),
    dob:z.string().min(1,"Date of birth is required"),
    student_email:z.email("Invalid email address").optional().refine(v=>v!==undefined),
    schoolId:z.string(),
    userId:z.string().optional().refine(v=>v!==undefined),
    status:z.enum(["active" , "inactive" , "transfered" , "graduated" , "suspended" , "expelled" , "withdrawn"]).default("active"),
    documents:z.object({
      photoUrl:z.string().optional(),
      birthCertificateUrl:z.string().optional(),
      transferCertificateUrl:z.string().optional(),
      previousMarksheetUrl:z.string().optional(),
      citizenshipOrIdUrl:z.string().optional(),
    }).optional(),
    healthInfo:z.object({
      bloodGroup:z.string().optional(),
    }).optional(),
})
export const studentCreate=studentSchema.extend(userSchema.shape);
export const studentFullSchema=studentCreate.extend(StudentEnrollmentSchema.shape);
export const studentUpdate=z.object({
    studentName:z.string().min(3,"Name must be at least 3 characters long").optional(),
    address:z.string().min(5,"Address must be at least 5 characters long").optional(),
    gender:z.string().min(1,"Gender is required").optional(),
    contact:z.string().min(10,"Contact number must be at least 10 characters long").optional(),
    dob:z.string().min(1,"Date of birth is required").optional(),
    student_email:z.email("Invalid email address").optional(),
    status:z.enum(["active" , "inactive" , "transfered" , "graduated" , "suspended" , "expelled" , "withdrawn"]).optional(),
    parentId:z.string().optional(),
    name:z.string().min(3,"Name must be at least 3 characters long").optional(),
    password:z.string().min(6,"Password must be at least 6 characters long").optional(),
    profileImage:z.string().optional(),
    is_active:z.coerce.boolean().optional(),
    documents:z.object({
      photoUrl:z.string().optional(),
      birthCertificateUrl:z.string().optional(),
      transferCertificateUrl:z.string().optional(),
      previousMarksheetUrl:z.string().optional(),
      citizenshipOrIdUrl:z.string().optional(),
    }).optional(),
    healthInfo:z.object({
      bloodGroup:z.string().optional(),
    }).optional(),
    academicYearId:z.string().min(1,"academicYearId is required").optional(),
    classId:z.string().min(1,"classId is required").optional(),
    sectionId:z.string().min(1,"sectionId is required").optional(),
    rollNumber:z.coerce.number().int().min(1,"rollNumber is required").optional(),
    promotedFromEnrollmentId:z.string().optional(),
    studentEnrollmentStatus:z.enum(["enrolled","pending","waitlisted","dropped","completed","failed","withdrawn","cancelled"]).optional(),
});
export type IStudentCreate=z.infer<typeof studentSchema>;
export interface IStudentInput extends IStudentCreate{
    studentName:string;
}
export type IStudentUpdate=z.infer<typeof studentUpdate>;