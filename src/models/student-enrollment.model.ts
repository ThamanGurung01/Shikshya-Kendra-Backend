 import {Schema,model,Types} from 'mongoose';
 export interface IStudentEnrollment {
  studentId: Types.ObjectId;
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  rollNumber: number;
  promotedFromEnrollmentId?: Types.ObjectId;
  status:"enrolled" | "pending" | "waitlisted" | "dropped" | "completed" | "failed" | "withdrawn" | "cancelled";
  joinedAt?: Date;
  leftAt?: Date;
};
export const studentEnrollmentSchema=new Schema<IStudentEnrollment>({
    studentId:{type:Types.ObjectId,ref:'Student',required:true},
    schoolId:{type:Types.ObjectId,ref:'School',required:true},
    academicYearId:{type:Types.ObjectId,ref:'AcademicYear',required:true},
    classId:{type:Types.ObjectId,ref:'Class',required:true},
    sectionId:{type:Types.ObjectId,ref:'Section',required:true},
    rollNumber:{type:Number,required:true},
    promotedFromEnrollmentId:{type:Types.ObjectId,ref:'StudentEnrollment'},
    status:{type:String,enum:["enrolled","pending","waitlisted","dropped","completed","failed","withdrawn","cancelled"],default:"pending",required:true},
    joinedAt:{type:Date},
    leftAt:{type:Date}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
})
export const StudentEnrollment = model<IStudentEnrollment>('StudentEnrollment',studentEnrollmentSchema);