import { Response } from 'express';

export const resCookie=(res:Response,refreshToken:string="", token:string="")=>{
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL?.includes('vercel.app') || !!process.env.FRONTEND_URL?.includes('onrender.com');

if(refreshToken){
    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure:isProduction,
        sameSite:isProduction?'none':'lax',
        maxAge:7*24*60*60*1000,
    })
}
if(token){
    res.cookie('accessToken',token,{
        httpOnly:true,
        secure:isProduction,
        sameSite:isProduction?'none':'lax',
        maxAge:15*60*1000,
    })
}
}