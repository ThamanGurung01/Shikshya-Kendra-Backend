import { z } from 'zod';

export const BookIssueSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  bookId: z.string().min(1, 'Book ID is required'),
  userType: z.enum(['student', 'teacher']),
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date(),
  notes: z.string().optional(),
}).refine(data => {
  if (data.userType === 'student') {
    return !!data.studentId;
  } else {
    return !!data.teacherId;
  }
}, {
  message: 'Appropriate User ID (studentId or teacherId) is required based on userType',
  path: ['studentId']
});

export type IBookIssueInput = z.infer<typeof BookIssueSchema>;
