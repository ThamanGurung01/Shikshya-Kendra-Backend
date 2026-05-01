import {Schema,model,Types} from 'mongoose';
export interface IUser{
    _id:Types.ObjectId;
    name:string;
    email:string;
    password:string;
    role:string;
    school_id?:Types.ObjectId;
    is_active:boolean;
    refresh_token?:string;
    createdAt:Date;
    updatedAt:Date;
    deletedAt?:Date;
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
role:{type:String,required:true},
school_id:{type:Types.ObjectId,ref:'School'},
is_active:{type:Boolean,default:true},
refresh_token:{type:String},
deletedAt:{type:Date}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const User=model<IUser>('User',userSchema);