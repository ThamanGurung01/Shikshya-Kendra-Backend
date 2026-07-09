import { z } from 'zod';

export const sendMailSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().min(1, 'Message content is required'),
  files: z.array(z.string()).default([]),
  targetType: z.enum(['individuals', 'roles', 'classes', 'sections']),
  recipientIds: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(),
  sectionIds: z.array(z.string()).optional(),
});

export type ISendMailInput = z.infer<typeof sendMailSchema>;
