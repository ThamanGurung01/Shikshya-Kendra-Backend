import {Schema,model,Types} from "mongoose";
export interface ISchool{
    school_name:string;
    address:string;
    contact:string;
    school_email?:string;
    website?:string;
    owner_id?:Types.ObjectId;
    kyc_files?:Array<{
    file_name:string;
    file_url:string;
    }>;
    verifiedAt?:Date|null;
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date|null;
}
const schoolSchema=new Schema<ISchool>({
    school_name:{type:String,required:true},
    address:{type:String,required:true},
    contact:{type:String,required:true},
    school_email:String,
    website:String,
    owner_id:{type:Types.ObjectId,ref:'User',default:null},
    kyc_files:[{
    file_name:String,
    file_url:String
    }],
    verifiedAt:{type:Date,default:null},
    deletedAt:{type:Date,default:null}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const School=model<ISchool>('School',schoolSchema);