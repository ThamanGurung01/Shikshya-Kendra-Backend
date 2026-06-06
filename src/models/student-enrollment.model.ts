 import {Schema,model,Types} from 'mongoose';
 export interface IStudentEnrollment {
  studentId: Types.ObjectId;
  schoolId: Types.ObjectId;

  academicYearId: Types.ObjectId;

  classId: Types.ObjectId;
  sectionId: Types.ObjectId;

  rollNumber: number;

  promotedFromEnrollmentId?: Types.ObjectId;

  status:string;
    // | "active"
    // | "promoted"
    // | "failed"
    // | "transferred"
    // | "graduated"
    // | "dropped";

  joinedAt: string;
  leftAt?: string;
deletedAt?:Date;
};
export const studentEnrollmentSchema=new Schema<IStudentEnrollment>({
    studentId:{type:Types.ObjectId,ref:'Student',required:true},
    schoolId:{type:Types.ObjectId,ref:'School',required:true},
    academicYearId:{type:Types.ObjectId,ref:'AcademicYear',required:true},
    classId:{type:Types.ObjectId,ref:'Class',required:true},
    sectionId:{type:Types.ObjectId,ref:'Section',required:true},
    rollNumber:{type:Number,required:true},
    promotedFromEnrollmentId:{type:Types.ObjectId,ref:'StudentEnrollment'},
    status:{type:String,required:true},
    joinedAt:{type:String,required:true},
    leftAt:{type:String},
    deletedAt:{type:Date,default:null}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
})