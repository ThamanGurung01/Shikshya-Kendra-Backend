import { Router } from "express";
import { downloadFile, uploadFile } from "../controllers/file.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadSingleFile } from "../middlewares/upload.middleware";

const fileRouter = Router();

fileRouter.get("/download", downloadFile);
fileRouter.post("/upload", authenticate, uploadSingleFile, uploadFile);

export default fileRouter;
