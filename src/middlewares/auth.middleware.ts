import { User } from '../models/user.model';
import { resCookie } from '../utils/cookie.util';
import {generateAccessToken, verifyToken } from '../utils/token.util';
import {Request,Response,NextFunction} from "express";
const REFRESH_FAILED_MESSAGE = "Invalid refresh token";
export interface AuthenticatedRequest extends Request {
    userId?: string;
}
export const authenticate=(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
try{
const token=req.cookies.accessToken;
if(!token) return refreshToken(req,res,next);
if(!process.env.ACCESS_TOKEN_SECRET) throw new Error('ACCESS_TOKEN_SECRET is not defined in environment variables');
const decoded=verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
if(!decoded) return res.status(401).json({success:false,message:"Invalid access token"});
req.userId=decoded;
next();
}catch(error){
    return refreshToken(req,res,next);
}
}

const refreshToken=async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
try {
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken) return res.status(401).json({success:false,message:REFRESH_FAILED_MESSAGE});
    if(!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    const decoded=verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if(!decoded) return res.status(401).json({success:false,message:REFRESH_FAILED_MESSAGE});
    const user=await User.findById(decoded);
    if(!user||user.refresh_token!==refreshToken) return res.status(401).json({success:false,message:REFRESH_FAILED_MESSAGE});
    const token=generateAccessToken(decoded);
    req.userId=decoded;
    resCookie(res,"",token);
    next();
} catch (error) {
    console.error("Refresh token error:", error);
    return res.status(401).json({success:false,message:REFRESH_FAILED_MESSAGE});
}
}