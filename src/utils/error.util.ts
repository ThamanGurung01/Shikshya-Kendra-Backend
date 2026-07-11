import { NextFunction, Request, Response } from "express";
export class ApiError extends Error {
    constructor(
        public statusCode:number,
        public message:string,
        public errors?:Record<string, any>
    ){
        super(message);
        this.name="APIError";
    }
}
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors })
    });
  }
  res.status(500).json({ success: false, message: 'Internal Server Error' });
};