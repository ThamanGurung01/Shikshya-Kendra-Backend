import {Request,Response} from "express";
import bcrypt from "bcrypt";
import {User} from "../models/user.model";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token.util";
import { LoginSchema,zodError } from "../validators/auth.validator";
import { resCookie } from "../utils/cookie.util";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { comparePassword } from "../utils/hash.util";
const AUTH_FAILED_MESSAGE = "Invalid email or password";

export const login=async(req:Request,res:Response)=>{
try{
  const parsed=LoginSchema.safeParse(req.body);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return res.status(400).json({success:false,errors:tree,message:"Validation failed"});}
const {email,password}=parsed.data;
const user=await User.findOne({email});
if(!user||!user.is_active) return res.status(401).json({success:false,message:AUTH_FAILED_MESSAGE});
const isMatch=await comparePassword(password,user.password);
if(!isMatch) return res.status(401).json({success:false,message:AUTH_FAILED_MESSAGE});
const token=generateAccessToken(user._id.toString());
const refreshToken=generateRefreshToken(user._id.toString());
user.refresh_token=refreshToken;
await user.save();
resCookie(res,refreshToken,token);
return res.json({success:true,data:{id:user._id,email:user.email,role:user.role},message:"Login successful"});
}catch(error){  
  console.error("Login error:", error);
return res.status(500).json({success:false,message:"Authentication failed"});
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
return res.json({success:true,message:"Logged out successfully"});
} catch (error) {
  console.error("Logout error:", error);
  return res.status(500).json({success:false,message:"Server error"});
}
}

export const authCheck=async (req:AuthenticatedRequest,res:Response)=>{
try {
  if (!req.userId) {
    return res.status(401).json({
      success:false,
      message: "Unauthorized"
    });
  }
  const user = await User.findById(req.userId).select("-password -refresh_token");
  if (!user) {
    return res.status(404).json({success:false,message: "User not found" });
  }
  return res.json({success:true,data:user,message:"Authenticated"});
} catch (error) {
  console.error("Auth check error:", error);
  return res.status(500).json({success:false,message:"Server error"});
}
}