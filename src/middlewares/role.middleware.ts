import {Response,NextFunction} from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { User } from '../models/user.model';

export const authorize=(allowedRoles:string[])=>{
    return async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
        const userId=req.userId;
        if(!userId) return res.status(401).json({success:false,message:"UnAuthenticated"});
        const user=await User.findById(userId);
        if(!user) return res.status(401).json({success:false,message:"UnAuthenticated"});
        if(!allowedRoles.includes(user.role)) return res.status(403).json({success:false,message:"Forbidden"});
        next();
    }
}