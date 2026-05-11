import {Schema,model,Types} from "mongoose";
export interface ISchool{
    slug:string;
    school_name:string;
    address:string;
    contact:string;
    school_email?:string;
    website?:string;
    map?:string;
    city?:string;
    country?:string;
    owner_id?:Types.ObjectId;
    documents?:Array<{
    panCertificate:{
        type:string;
        value:string;
    };
    registrationCertificate:string;
    }>;
    verifiedAt?:Date|null;
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date|null;
}
const schoolSchema=new Schema<ISchool>({
    slug:{type:String,required:true,unique:true},
    school_name:{type:String,required:true},
    address:{type:String,required:true},
    contact:{type:String,required:true},
    school_email:{type:String},
    website:{type:String},
    map:{type:String},
    city:{type:String},
    country:{type:String},
    owner_id:{type:Types.ObjectId,ref:'User',default:null},
    documents:[{
    panCertificate:{
        type:{type:String,required:true},
        value:{type:String,required:true}
    },
    registrationCertificate:{type:String,required:true}
    }],
    verifiedAt:{type:Date,default:null},
    deletedAt:{type:Date,default:null}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const School=model<ISchool>('School',schoolSchema);