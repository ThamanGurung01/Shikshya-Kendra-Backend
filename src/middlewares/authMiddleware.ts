import {verifyToken } from '../utils/token';
import {Request,Response,NextFunction} from "express";
export interface AuthenticatedRequest extends Request {
    userId?: string;
}
export const authenticate=(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
const token=req.cookies.accessToken;
if(!token) return res.status(401).json({message:"Access token not provided"});
if(!process.env.ACCESS_TOKEN_SECRET) throw new Error('ACCESS_TOKEN_SECRET is not defined in environment variables');
const decoded=verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
if(!decoded) return res.status(401).json({message:"Invalid access token"});
req.userId=decoded;
next();
}