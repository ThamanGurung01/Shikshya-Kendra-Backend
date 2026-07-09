import type { Response } from "express";
import https from "https";
import http from "http";
import { URL } from "url";
import cloudinary from "../configs/cloudinary";

export const parseCloudinaryUrl = (urlStr: string) => {
  try {
    const url = new URL(urlStr);
    if (!url.hostname.includes("cloudinary.com")) {
      return null;
    }

    const pathname = url.pathname;
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length < 4) return null;

    const resourceType = (parts[1] || "image") as any;
    const deliveryType = (parts[2] || "upload") as any;

    let versionIndex = -1;
    for (let i = 3; i < parts.length; i++) {
      const part = parts[i];
      if (part && (/^v\d+$/.test(part) || /^\d+$/.test(part))) {
        versionIndex = i;
        break;
      }
    }

    const startIndex = versionIndex !== -1 ? versionIndex + 1 : 3;
    const remainingParts = parts.slice(startIndex);
    const fullPath = remainingParts.join("/");

    const lastDotIndex = fullPath.lastIndexOf(".");
    const format =
      lastDotIndex !== -1 ? fullPath.substring(lastDotIndex + 1) : "";

    let publicId = fullPath;
    if (resourceType === "image" || resourceType === "video") {
      if (lastDotIndex !== -1) {
        publicId = fullPath.substring(0, lastDotIndex);
      }
    }

    return {
      resourceType,
      deliveryType,
      publicId,
      format,
    };
  } catch (err) {
    console.error("Error parsing Cloudinary URL:", urlStr, err);
    return null;
  }
};

export const streamFileFromUrl = (
  fileUrl: string,
  res: Response,
  fileName: string,
  disposition: "inline" | "attachment" = "attachment",
  maxRedirects: number = 5,
): void => {
  const download = (currentUrl: string, redirectCount: number) => {
    if (redirectCount > maxRedirects) {
      console.error(
        `Max redirects (${maxRedirects}) exceeded for URL: ${fileUrl}`,
      );
      res
        .status(502)
        .json({ error: "Failed to download file: Too many redirects" });
      return;
    }

    try {
      const parsedUrl = new URL(currentUrl);
      const client = parsedUrl.protocol === "https:" ? https : http;

      const options = {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        },
      };

      client
        .get(currentUrl, options, (response) => {
          const { statusCode } = response;

          if (
            statusCode &&
            statusCode >= 300 &&
            statusCode < 400 &&
            response.headers.location
          ) {
            let redirectUrl = response.headers.location;
            if (!redirectUrl.startsWith("http")) {
              redirectUrl = new URL(redirectUrl, currentUrl).href;
            }
            download(redirectUrl, redirectCount + 1);
            return;
          }

          if (statusCode !== 200) {
            console.error(
              `Failed to stream from storage. URL: ${currentUrl}, Status Code: ${statusCode}`,
            );
            res.status(502).json({
              error: "Bad Gateway",
              message: `Failed to stream file from storage (status code: ${statusCode})`,
            });
            return;
          }

          res.setHeader(
            "Content-Disposition",
            `${disposition}; filename="${encodeURIComponent(fileName)}"`,
          );

          const contentType = response.headers["content-type"];
          if (contentType) {
            res.setHeader("Content-Type", contentType);
          }

          response.pipe(res);
        })
        .on("error", (err) => {
          console.error(
            `Request error downloading file from URL ${currentUrl}:`,
            err,
          );
          if (!res.headersSent) {
            res.status(500).json({
              error: "Internal Server Error streaming file from storage",
            });
          }
        });
    } catch (err: any) {
      console.error(`Invalid URL parsing error: ${currentUrl}`, err);
      if (!res.headersSent) {
        res.status(400).json({ error: "Invalid file URL" });
      }
    }
  };

  let startUrl = fileUrl;
  if (fileUrl.includes("cloudinary.com")) {
    const parsed = parseCloudinaryUrl(fileUrl);
    if (parsed) {
      try {
        startUrl = cloudinary.utils.private_download_url(
          parsed.publicId,
          parsed.format,
          {
            resource_type: parsed.resourceType,
            type: parsed.deliveryType,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        );
      } catch (signErr: any) {
        console.error(
          "Failed to generate signed Cloudinary download URL:",
          signErr,
        );
      }
    }
  }

  download(startUrl, 0);
};
