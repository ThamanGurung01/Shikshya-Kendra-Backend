import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response.util';

interface UploadedFiles {
  panCertificate?: Express.Multer.File[];
  registrationCertificate?: Express.Multer.File[];
}

export const uploadSchoolDocs = (req: Request, res: Response) => {
  try {
    const files = req.files as UploadedFiles | undefined;

    if (!files) {
      return sendError(res, 'No files uploaded', undefined, 400);
    }

    const panFile = files.panCertificate?.[0];
    const regFile = files.registrationCertificate?.[0];

    // Build response with whatever was uploaded
    const result: {
      panCertificate?: { type: string; value: string };
      registrationCertificate?: string;
    } = {};

    if (panFile) {
      result.panCertificate = {
        type: panFile.mimetype,
        value: (panFile as any).path, // Cloudinary returns `path` as secure_url
      };
    }

    if (regFile) {
      result.registrationCertificate = (regFile as any).path;
    }

    return sendSuccess(res, 'Files uploaded successfully', result, 200);
  } catch (error) {
    console.error('Upload error:', error);
    return sendError(res, 'File upload failed', undefined, 500);
  }
};
