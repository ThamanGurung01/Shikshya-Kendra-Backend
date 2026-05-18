import {Response,NextFunction} from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import * as userService from '../services/user.service';
import { sendError } from '../utils/response.util';

export const authorize=(allowedRoles:string[])=>{
    return async(req:AuthenticatedRequest,res:Response,next:NextFunction)=>{
        const userId=req.userId;
        if(!userId) return sendError(res,"UnAuthenticated",undefined,401);
        const user=await userService.getUserById(userId);
        if(!user) return sendError(res,"UnAuthenticated",undefined,401);
        if(!allowedRoles.includes(user.role)) return sendError(res,"Forbidden",undefined,403);
        req.role=user.role;
        next();
    }
}