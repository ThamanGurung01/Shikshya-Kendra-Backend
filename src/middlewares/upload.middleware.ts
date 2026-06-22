import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../configs/cloudinary';

const studentDocFields = ['photo', 'birthCertificate', 'transferCertificate', 'previousMarksheet', 'citizenshipOrId'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req: any, file: any) => ({
    folder: file.fieldname === 'profileImage' ? 'profile-images'
      : studentDocFields.includes(file.fieldname) ? 'student-documents'
      : file.fieldname === 'logo' ? 'school-logos'
      : 'school-documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
  }),
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp) and PDF files are allowed'));
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
