import {Schema,model,Types} from 'mongoose';
export interface IUser{
    name:string;
    email:string;
    password:string;
    role:string;
    profileImage?:string|null;
    is_active:boolean;
    refresh_token?:string;
    lastlogin?:Date|null;
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date;
}

const userSchema=new Schema<IUser>({
name:{type:String,required:true},
email:{type:String,required:true,unique:true},
password:{type:String,required:true},
role:{type:String,required:true},
profileImage:{type:String},
is_active:{type:Boolean,default:true},
refresh_token:{type:String},
lastlogin:{type:Date,default:null},
deletedAt:{type:Date},
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const User=model<IUser>('User',userSchema);