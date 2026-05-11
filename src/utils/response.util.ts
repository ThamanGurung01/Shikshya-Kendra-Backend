import { Response } from "express";
export interface ApiResponse<T=any>{
    success:boolean;
    message:string;
    data?:T;
    errors?:string[] | Record<string, string[]>;
}
export const sendResponse=<T=any>(
    res:Response,
    statusCode:number,
    success:boolean,
    message:string,
    data?:T,
    errors?:string[] | Record<string, string[]>
)=>{
    const response:ApiResponse<T>={
        success,
        message,
        ...(data !== undefined && {data}),
        ...(errors !== undefined && {errors})
    }
    return res.status(statusCode).json(response);
}
export const sendSuccess=<T=any>(
    res:Response,
    message:string,
    data?:T,
    statusCode=200
)=>{
    return sendResponse(res,statusCode,true,message,data);
}
export const sendError=(
    res:Response,
    message:string,
    errors?:string[] | Record<string, string[]>,
    statusCode=400
)=>{
    return sendResponse(res,statusCode,false,message,undefined,errors);
}