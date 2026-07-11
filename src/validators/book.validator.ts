import { z } from 'zod';

export const BookSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  price: z.number().min(0, 'Price cannot be negative').optional(),
  rackNumber: z.string().optional(),
});

export type IBookInput = z.infer<typeof BookSchema>;
