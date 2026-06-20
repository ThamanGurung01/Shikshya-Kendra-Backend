import { z } from 'zod';
import { userSchema } from './user.validator';

const teacherSchema = z.object({
  employeeId: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  gender: z.string().min(1, 'Gender is required'),
  contact: z.string().min(10, 'Contact number must be at least 10 characters long'),
  dob: z.string().min(1, 'Date of birth is required'),
  teacher_email: z.email('Invalid email address').optional().refine((v) => v !== undefined),
  schoolId: z.string(),
  userId: z.string().optional().refine((v) => v !== undefined),
  status: z.enum(['active', 'inactive']).default('active'),
  qualification: z.string().optional(),
  joinDate: z.string().optional(),
});

export const teacherCreate = teacherSchema.extend(userSchema.shape);

export const teacherUpdate = z.object({
  teacherName: z.string().min(3, 'Name must be at least 3 characters long').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long').optional(),
  gender: z.string().min(1, 'Gender is required').optional(),
  contact: z.string().min(10, 'Contact number must be at least 10 characters long').optional(),
  dob: z.string().min(1, 'Date of birth is required').optional(),
  teacher_email: z.email('Invalid email address').optional(),
  status: z.enum(['active', 'inactive']).optional(),
  qualification: z.string().optional(),
  joinDate: z.string().optional(),
  name: z.string().min(3, 'Name must be at least 3 characters long').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  profileImage: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type ITeacherCreate = z.infer<typeof teacherSchema>;
export interface ITeacherInput extends ITeacherCreate {
  teacherName: string;
}
export type ITeacherUpdate = z.infer<typeof teacherUpdate>;
