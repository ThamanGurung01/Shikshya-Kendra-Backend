import { z, ZodError } from 'zod';

export const SubjectSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
});

export const zodError = (parsedError: ZodError) => {
  const tree = z.treeifyError(parsedError);
  return tree.errors;
};

export type ISubjectInput = z.infer<typeof SubjectSchema>;