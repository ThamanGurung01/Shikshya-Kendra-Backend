import { z, ZodError } from 'zod';

export const ClassSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  name: z.string().min(1, 'Name is required'),
});

export const zodError = (parsedError: ZodError) => {
  const tree = z.treeifyError(parsedError);
  return tree.errors;
};

export type IClassInput = z.infer<typeof ClassSchema>;