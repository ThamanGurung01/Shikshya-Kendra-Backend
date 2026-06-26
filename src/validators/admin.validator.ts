import { z } from 'zod';
import { userSchema } from './user.validator';

const adminSchema = z.object({
  employeeId: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  gender: z.string().min(1, 'Gender is required'),
  contact: z.string().min(10, 'Contact number must be at least 10 characters long'),
  dob: z.string().min(1, 'Date of birth is required'),
  admin_email: z.email('Invalid email address').optional().refine((v) => v !== undefined),
  schoolId: z.string(),
  userId: z.string().optional().refine((v) => v !== undefined),
  status: z.enum(['active', 'inactive']).default('active'),
  qualification: z.string().optional(),
  joinDate: z.string().optional(),
});

export const adminCreate = adminSchema.extend(userSchema.shape);

export const adminUpdate = z.object({
  adminName: z.string().min(3, 'Name must be at least 3 characters long').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long').optional(),
  gender: z.string().min(1, 'Gender is required').optional(),
  contact: z.string().min(10, 'Contact number must be at least 10 characters long').optional(),
  dob: z.string().min(1, 'Date of birth is required').optional(),
  admin_email: z.email('Invalid email address').optional(),
  status: z.enum(['active', 'inactive']).optional(),
  qualification: z.string().optional(),
  joinDate: z.string().optional(),
  name: z.string().min(3, 'Name must be at least 3 characters long').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  profileImage: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type IAdminCreate = z.infer<typeof adminSchema>;
export interface IAdminInput extends IAdminCreate {
  adminName: string;
}
export type IAdminUpdate = z.infer<typeof adminUpdate>;
