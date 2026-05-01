import {Schema,model,Types} from "mongoose";
export interface ISchool{
    name:string;
    address:string;
    contact:string;
    email:string;
    website?:string;
    owner_id?:Types.ObjectId;
    kyc_files?:Array<{
    file_name:string;
    file_url:string;
    }>;
    verifiedAt?:Date;
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date;
}
const schoolSchema=new Schema<ISchool>({
    name:{type:String,required:true},
    address:{type:String,required:true},
    contact:{type:String,required:true},
    email:{type:String,required:true},
    website:String,
    owner_id:{type:Types.ObjectId,ref:'User',default:null},
    kyc_files:[{
    file_name:String,
    file_url:String
    }],
    verifiedAt:Date,
    deletedAt:Date

},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const School=model<ISchool>('School',schoolSchema);