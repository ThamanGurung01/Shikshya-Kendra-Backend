import {Schema,model,Types} from "mongoose";
export interface ISchool{
    _id:Types.ObjectId;
    name:string;
    address:string;
    phone?:string;
    email?:string;
    kyc_files?:string[];
    created_at:Date;
    updated_at:Date;
}
const schoolSchema=new Schema<ISchool>({
    name:{type:String,required:true},
    address:{type:String,required:true},
    phone:{type:String},
    email:{type:String}
},{
    timestamps:{createdAt:'created_at',updatedAt:'updated_at'}
});
export const School=model<ISchool>('School',schoolSchema);