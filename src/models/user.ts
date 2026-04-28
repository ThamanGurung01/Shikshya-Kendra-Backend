import {Schema,model,Types} from 'mongoose';
export interface IUser{
    _id:Types.ObjectId;
    name:string;
    email:string;
    password:string;
    phone?:string;
    role:string;
    is_active:boolean;
    verified_date?:Date;
    refresh_token?:string;
    createdAt:Date;
    updatedAt:Date;
}
// roles 
// superadmin
// owner
// admin
// teacher
// student
// parent
// librarian
// accountant
const userSchema=new Schema<IUser>({
name:{type:String,required:true},
email:{type:String,required:true,unique:true},
password:{type:String,required:true},
phone:{type:String},
role:{type:String,required:true},
is_active:{type:Boolean,default:true},
refresh_token:{type:String},
verified_date:{type:Date},
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const User=model<IUser>('User',userSchema);