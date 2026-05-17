import {model,Schema,Types} from "mongoose";
export interface IStudent{
    address:string;
    contact:string;
    student_email?:string;
    school_id:Types.ObjectId;
    user_id:Types.ObjectId;
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date|null;
}
const studentSchema=new Schema<IStudent>({
    address:{type:String,required:true},
    contact:{type:String,required:true},
    student_email:{type:String},
    school_id:{type:Types.ObjectId,ref:'School',required:true},
    user_id:{type:Types.ObjectId,ref:'User',required:true},
    deletedAt:{type:Date,default:null}
},{
    timestamps:{
        createdAt:'createdAt',
        updatedAt:'updatedAt'
    }
})
export const Student=model<IStudent>('Student',studentSchema);