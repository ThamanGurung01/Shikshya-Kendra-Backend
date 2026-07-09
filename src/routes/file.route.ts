import { Router } from "express";
import { downloadFile } from "../controllers/file.controller";

const fileRouter = Router();

fileRouter.get("/download", downloadFile);

export default fileRouter;
