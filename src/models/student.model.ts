import {model,Schema,Types} from "mongoose";
export interface IStudent{
    admissionNumber:string;
    address:string;
    gender:string;
    contact:string;
    dob:Date;
    student_email?:string;
    schoolId:Types.ObjectId;
    userId:Types.ObjectId;
    status:"active" | "inactive" | "transfered" | "graduated" | "suspended" | "expelled" | "withdrawn";
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date|null;
}
const studentSchema=new Schema<IStudent>({
    admissionNumber:{type:String,required:true,unique:true},
    address:{type:String,required:true},
    gender:{type:String,required:true},
    contact:{type:String,required:true},
    dob:{type:Date,required:true},
    student_email:{type:String},
    schoolId:{type:Types.ObjectId,ref:'School',required:true},
    userId:{type:Types.ObjectId,ref:'User',required:true},
    status:{type:String,enum:["active","inactive","transfered","graduated","suspended","expelled","withdrawn"],default:"active"},
    deletedAt:{type:Date,default:null}
},{
    timestamps:{
        createdAt:'createdAt',
        updatedAt:'updatedAt'
    }
})
export const Student=model<IStudent>('Student',studentSchema);