import { z, ZodError } from 'zod';

export const SectionSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  name: z.string().min(1, 'Name is required'),
});

export const zodError = (parsedError: ZodError) => {
  const tree = z.treeifyError(parsedError);
  return tree.errors;
};

export type ISectionInput = z.infer<typeof SectionSchema>;