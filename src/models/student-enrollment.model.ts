 import {Schema,model,Types} from 'mongoose';
 export interface IStudentEnrollment {
  studentId: Types.ObjectId;
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  rollNumber?: number;
  promotedFromEnrollmentId?: Types.ObjectId;
  studentEnrollmentStatus:"active" | "promoted" | "failed" | "transferred" | "graduated" | "dropped";
  joinedAt?: Date;
  leftAt?: Date;
};
export const studentEnrollmentSchema=new Schema<IStudentEnrollment>({
    studentId:{type:Types.ObjectId,ref:'Student',required:true},
    schoolId:{type:Types.ObjectId,ref:'School',required:true},
    academicYearId:{type:Types.ObjectId,ref:'AcademicYear',required:true},
    classId:{type:Types.ObjectId,ref:'Class',required:true},
    sectionId:{type:Types.ObjectId,ref:'Section',required:true},
    rollNumber:{type:Number},
    promotedFromEnrollmentId:{type:Types.ObjectId,ref:'StudentEnrollment'},
    studentEnrollmentStatus:{type:String,enum:["active","promoted","failed","transferred","graduated","dropped"],default:"active",required:true},
    joinedAt:{type:Date},
    leftAt:{type:Date}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
})
export const StudentEnrollment = model<IStudentEnrollment>('StudentEnrollment',studentEnrollmentSchema);