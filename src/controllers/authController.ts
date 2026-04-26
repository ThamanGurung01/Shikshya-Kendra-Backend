import {Request,Response} from "express";
import bcrypt from "bcrypt";
import {User} from "../models/user";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token";
import { LoginSchema,zodError } from "../validators/auth";
import { resCookie } from "../utils/cookie";
const AUTH_FAILED_MESSAGE = "Invalid email or password";
const REFRESH_FAILED_MESSAGE = "Invalid refresh token";
export const login=async(req:Request,res:Response)=>{
try{
  const parsed=LoginSchema.safeParse(req.body);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return res.status(400).json({errors:tree,message:"Validation failed"});}
const {email,password}=parsed.data;
const user=await User.findOne({email});
if(!user||!user.is_active) return res.status(401).json({message:AUTH_FAILED_MESSAGE});
const isMatch=await bcrypt.compare(password,user.password);
if(!isMatch) return res.status(401).json({message:AUTH_FAILED_MESSAGE});
const token=generateAccessToken(user._id.toString());
const refreshToken=generateRefreshToken(user._id.toString());
user.refresh_token=refreshToken;
await user.save();
resCookie(res,refreshToken,token);
return res.json({userData:{id:user._id,email:user.email,role:user.role,verified_date:user.verified_date},message:"Login successful"});
}catch(error){  
  console.error("Login error:", error);
return res.status(500).json({message:"Authentication failed"});
}
}

export const refreshToken=async(req:Request,res:Response)=>{
try {
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken) return res.status(401).json({message:REFRESH_FAILED_MESSAGE});
    if(!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    const decoded=verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if(!decoded) return res.status(401).json({message:REFRESH_FAILED_MESSAGE});
    const user=await User.findById(decoded);
    if(!user||user.refresh_token!==refreshToken) return res.status(401).json({message:REFRESH_FAILED_MESSAGE});
    const token=generateAccessToken(decoded);
    const newRefreshToken=generateRefreshToken(decoded);
    user.refresh_token=newRefreshToken;
    await user.save();
    resCookie(res,newRefreshToken,token);
    return res.json({message:"Access token refreshed"});
} catch (error) {
    console.error("Refresh token error:", error);
    return res.status(401).json({message:REFRESH_FAILED_MESSAGE});
}
}
export const logout=async(req:Request,res:Response)=>{
try {
  const token = req.cookies.refreshToken;

  if (token) {
    if(!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    const decoded = verifyToken(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded);

    if (user) {
      user.refresh_token = "";
      await user.save();
    }
  }
res.clearCookie('refreshToken');
res.clearCookie('accessToken');
return res.json({message:"Logged out successfully"});
} catch (error) {
  console.error("Logout error:", error);
  return res.status(500).json({message:"Server error"});
}
}