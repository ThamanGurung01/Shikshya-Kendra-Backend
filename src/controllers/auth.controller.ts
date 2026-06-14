import {Request,Response} from "express";
import {User} from "../models/user.model";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token.util";
import { zodError } from "../utils/zod-error.util";
import { LoginSchema } from "../validators/auth.validator";
import { resCookie } from "../utils/cookie.util";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { comparePassword } from "../utils/hash.util";
import { sendError, sendSuccess } from "../utils/response.util";
const AUTH_FAILED_MESSAGE = "Invalid email or password";

export const login=async(req:Request,res:Response)=>{
try{
  const parsed=LoginSchema.safeParse(req.body);
if(!parsed.success) {
  const tree=zodError(parsed.error);
  return sendError(res,"Validation failed",tree,400);}
const {email,password}=parsed.data;
const user=await User.findOne({email});
if(!user||!user.is_active) return sendError(res,AUTH_FAILED_MESSAGE,undefined,401);
const isMatch=await comparePassword(password,user.password);
if(!isMatch) return sendError(res,AUTH_FAILED_MESSAGE,undefined,401);
const token=generateAccessToken(user._id.toString());
const refreshToken=generateRefreshToken(user._id.toString());
user.refresh_token=refreshToken;
user.lastlogin=new Date();
await user.save();
resCookie(res,refreshToken,token);
return sendSuccess(res,"Login successful",{id:user._id,email:user.email,role:user.role});
}catch(error){  
  console.error("Login error:", error);
return sendError(res,"Authentication failed",undefined,500);
}
}
export const logout=async(req:Request,res:Response)=>{
try {
  const token = req.cookies.refreshToken;

  if (token) {
    if(!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    const decoded = verifyToken(token, process.env.REFRESH_TOKEN_SECRET);
    if(!decoded) throw new Error('Invalid refresh token');
    const user = await User.findById(decoded);

    if (user) {
      user.refresh_token = "";
      await user.save();
    }
  }
res.clearCookie('refreshToken');
res.clearCookie('accessToken');
return sendSuccess(res,"Logged out successfully");
} catch (error) {
  console.error("Logout error:", error);
  return sendError(res,"Server error",undefined,500);
}
}

export const authCheck=async (req:AuthenticatedRequest,res:Response)=>{
try {
  if (!req.userId) {
    return sendError(res,"Unauthorized",undefined,401);
  }
  const user = await User.findById(req.userId).select("-password -refresh_token");
  if (!user) {
    return sendError(res,"User not found",undefined,404);
  }
  return sendSuccess(res,"Authenticated",user);
} catch (error) {
  console.error("Auth check error:", error);
  return sendError(res,"Server error",undefined,500);
}
}