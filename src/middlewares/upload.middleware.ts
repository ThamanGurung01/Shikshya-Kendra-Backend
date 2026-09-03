import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../configs/cloudinary';

const studentDocFields = ['photo', 'birthCertificate', 'transferCertificate', 'previousMarksheet', 'citizenshipOrId'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req: any, file: any) => {
    const lastDot = file.originalname.lastIndexOf('.');
    const baseName = lastDot !== -1 ? file.originalname.substring(0, lastDot) : file.originalname;
    const ext = lastDot !== -1 ? file.originalname.substring(lastDot + 1).toLowerCase() : '';
    const isImageOrPdf = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    const publicIdName = isImageOrPdf
      ? `${Date.now()}-${baseName.replace(/\s+/g, '-')}`
      : `${Date.now()}-${baseName.replace(/\s+/g, '-')}.${ext}`;

    return {
      folder: (file.fieldname === 'profileImage' || file.fieldname === 'image' || file.fieldname === 'avatar') ? 'profile-images'
        : studentDocFields.includes(file.fieldname) ? 'student-documents'
        : file.fieldname === 'logo' ? 'school-logos'
        : 'school-documents',
      resource_type: 'auto',
      public_id: publicIdName,
    };
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and common document formats (doc, docx, xls, xlsx, ppt, pptx, txt) are allowed'));
  }
};

const imageOnlyFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'panCertificate', maxCount: 1 },
  { name: 'registrationCertificate', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'transferCertificate', maxCount: 1 },
  { name: 'previousMarksheet', maxCount: 1 },
  { name: 'citizenshipOrId', maxCount: 1 },
]);

export const uploadSingleFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
}).single('file');

export const uploadProfileImage = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);


