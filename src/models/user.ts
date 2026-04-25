import {Schema,model,Types} from 'mongoose';
export interface IUser{
    _id:Types.ObjectId;
    name:string;
    email:string;
    password:string;
    phone?:string;
    role:Types.ObjectId;
    is_active:boolean;
    verified_date?:Date;
    refresh_token?:string;
    createdAt:Date;
    updatedAt:Date;
}
const userSchema=new Schema<IUser>({
name:{type:String,required:true},
email:{type:String,required:true,unique:true},
password:{type:String,required:true},
phone:{type:String},
role:{type:Types.ObjectId,ref:'Role'},
is_active:{type:Boolean,default:true}
},{
    timestamps:{createdAt:'createdAt',updatedAt:'updatedAt'}
});
export const User=model<IUser>('User',userSchema);