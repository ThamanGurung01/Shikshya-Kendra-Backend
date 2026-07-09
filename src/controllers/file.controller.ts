import type { Request, Response } from "express";
import path from "path";
import { URL } from "url";
import { streamFileFromUrl } from "../services/file.service";

export const downloadFile = (req: Request, res: Response): void => {
  const fileUrl = req.query.url as string;
  const inline = req.query.inline === "true";
  const disposition = inline ? "inline" : "attachment";

  if (!fileUrl) {
    res.status(400).json({ error: "URL parameter is required" });
    return;
  }

  try {
    if (
      fileUrl.startsWith("/") ||
      fileUrl.includes("localhost:8000/uploads/") ||
      fileUrl.includes("127.0.0.1:8000/uploads/")
    ) {
      const relativePath = fileUrl.includes("/uploads/")
        ? fileUrl.substring(fileUrl.indexOf("/uploads/"))
        : fileUrl;
      const localPath = path.join(
        process.cwd(),
        relativePath.startsWith("/") ? relativePath.slice(1) : relativePath,
      );
      if (inline) {
        res.setHeader("Content-Disposition", "inline");
        res.sendFile(localPath);
      } else {
        res.download(localPath);
      }
      return;
    }

    const parsedUrl = new URL(fileUrl);
    const filename = path.basename(parsedUrl.pathname) || "download";

    streamFileFromUrl(fileUrl, res, filename, disposition);
  } catch (error: any) {
    console.error("Invalid URL or download error:", error);
    res.status(400).json({ error: "Invalid URL provided or download failed" });
  }
};
