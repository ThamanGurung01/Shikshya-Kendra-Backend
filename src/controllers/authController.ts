import {Request,Response} from "express";
import bcrypt from "bcrypt";
import {User} from "../models/user";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token";
export const login=async(req:Request,res:Response)=>{
try{
const {email,password}=req.body;
const user=await User.findOne({email});
if(!user) return res.status(400).json({message:"Email doesn't exist"});
if(!user.is_active) return res.status(403).json({message:"Account is inactive"});
const isMatch=await bcrypt.compare(password,user.password);
if(!isMatch) return res.status(400).json({message:"Invalid credentials"});
const token=generateAccessToken(user._id.toString());
const refreshToken=generateRefreshToken(user._id.toString());
user.refresh_token=refreshToken;
await user.save();
const NodeEnvironment=(process.env.NODE_ENV||'development')==='production'?true:false;
res.cookie('refreshToken',refreshToken,{
    httpOnly:true,
    secure:NodeEnvironment,
    sameSite:NodeEnvironment?'strict':'lax',
})
res.cookie('accessToken',token,{
    httpOnly:false,
    secure:NodeEnvironment,
    sameSite:NodeEnvironment?'strict':'lax',
})
res.json({userData:{id:user._id,email:user.email,role:user.role,verified_date:user.verified_date},message:"Login successful"});
}catch(error){  
res.status(500).json({message:"Server error",error});
}
}

export const refreshToken=async(req:Request,res:Response)=>{
try {
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken) return res.status(401).json({message:"No refresh token provided"});
    if(!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    const decoded=verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if(!decoded) return res.status(401).json({message:"Invalid refresh token"});
    const user=await User.findById(decoded);
    if(!user||user.refresh_token!==refreshToken) return res.status(401).json({message:"Invalid refresh token"});
    const token=generateAccessToken(decoded);
    const newRefreshToken=generateRefreshToken(decoded);
    user.refresh_token=newRefreshToken;
    await user.save();
    const NodeEnvironment = (process.env.NODE_ENV || "development") === "production";
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: NodeEnvironment,
      sameSite: NodeEnvironment ? "strict" : "lax",
    });
    res.cookie("accessToken", token, {
      httpOnly: false,
      secure: NodeEnvironment,
      sameSite: NodeEnvironment ? "strict" : "lax",
    });
    res.json({message:"Access token refreshed"});
} catch (error) {
    res.status(401).json({message:"Invalid refresh token"});
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
res.json({message:"Logged out successfully"});
} catch (error) {
  res.status(500).json({message:"Server error", error});
}
}