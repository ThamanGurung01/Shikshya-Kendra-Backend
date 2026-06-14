import {model,Schema,Types} from "mongoose";

export interface IParent{
    fatherName?:string;
    fatherPhone?:string;
    motherName?:string;
    motherPhone?:string;
    guardianName?:string;
    guardianPhone?:string;
    relation?:string;
    primarygurdianemail:string;
    userId:Types.ObjectId;
    createdAt:Date;
    updatedAt:Date;
}

const parentSchema=new Schema<IParent>({
    fatherName:{type:String},
    fatherPhone:{type:String},
    motherName:{type:String},
    motherPhone:{type:String},
    guardianName:{type:String},
    guardianPhone:{type:String},
    relation:{type:String},
    primarygurdianemail:{type:String,required:true},
    userId:{type:Schema.Types.ObjectId,ref:'User',required:true}
},{
    timestamps:{
        createdAt:'createdAt',
        updatedAt:'updatedAt'
    }
});

export const Parent=model<IParent>('Parent',parentSchema);
