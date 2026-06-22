import {model,Schema,Types} from "mongoose";
export interface IStudent{
    admissionNumber:string;
    studentName:string;
    address:string;
    gender:string;
    contact?:string;
    dob:Date;
    student_email?:string;
    schoolId:Types.ObjectId;
    userId:Types.ObjectId;
    status:"active" | "inactive" | "transfered" | "graduated" | "suspended" | "expelled" | "withdrawn";
    parentId?: Types.ObjectId|null;
    documents?: {
      photoUrl?: string;
      birthCertificateUrl?: string;
      transferCertificateUrl?: string;
      previousMarksheetUrl?: string;
      citizenshipOrIdUrl?: string;
    };
    healthInfo?: {
      bloodGroup?: string;
    };
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date|null;
}
const studentSchema=new Schema<IStudent>({
    studentName:{type:String,required:true},
    admissionNumber:{type:String,required:true,unique:true},
    address:{type:String,required:true},
    gender:{type:String,required:true},
    contact:{type:String},
    dob:{type:Date,required:true},
    student_email:{type:String},
    schoolId:{type:Types.ObjectId,ref:'School',required:true},
    userId:{type:Types.ObjectId,ref:'User',required:true},
    status:{type:String,enum:["active","inactive","transfered","graduated","suspended","expelled","withdrawn"],default:"active"},
    parentId:{type:Types.ObjectId,ref:'Parent', default:null},
    documents:{
      type:new Schema({
        photoUrl:{type:String},
        birthCertificateUrl:{type:String},
        transferCertificateUrl:{type:String},
        previousMarksheetUrl:{type:String},
        citizenshipOrIdUrl:{type:String},
      },{_id:false}),
      default:undefined,
    },
    healthInfo:{
      type:new Schema({
        bloodGroup:{type:String},
      },{_id:false}),
      default:undefined,
    },
    deletedAt:{type:Date,default:null}
},{
    timestamps:{
        createdAt:'createdAt',
        updatedAt:'updatedAt'
    }
})
export const Student=model<IStudent>('Student',studentSchema);