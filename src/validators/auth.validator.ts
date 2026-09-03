import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const UpdateProfileContactSchema = z.object({
  contact: z.string().min(7, 'Contact number must be at least 7 characters long').max(20, 'Contact number is too long').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export type UpdateProfileContactInput = z.infer<typeof UpdateProfileContactSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;