import { Response } from 'express';
export const resCookie=(res:Response,refreshToken:string="", token:string="")=>{
const NodeEnvironment=(process.env.NODE_ENV||'development')==='production'?true:false;
if(refreshToken){
    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure:NodeEnvironment,
        sameSite:NodeEnvironment?'strict':'lax',
        maxAge:7*24*60*60*1000,
    })
}
if(token){
    res.cookie('accessToken',token,{
        httpOnly:false,
        secure:NodeEnvironment,
        sameSite:NodeEnvironment?'strict':'lax',
        maxAge:15*60*1000,
    })
}
}