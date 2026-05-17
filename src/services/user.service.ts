import { Types } from "mongoose";
import { User } from "../models/user.model";
import { IUserInput } from "../validators/user.validator";

//create
export const createUser=async(data:IUserInput)=>{
    return await User.create(data);
}
//get all
export const getAllUsers=async()=>{
    return await User.find().limit(20).sort({createdAt:-1});
}
//get by id
export const getUserById=async(id:string)=>{
    return await User.findById(id);
}
//get by email
export const getUserByEmail=async(email:string,currentId:string)=>{
    return await User.findOne({email});
}
//update
export const updateUser=async(id:string,data:IUserInput)=>{
    return await User.findByIdAndUpdate(id, data, {returnDocument:'after',runValidators: true});
}
// hard delete
export const hardDeleteUser=async(id:string)=>{
    return await User.findByIdAndDelete(id);
}
