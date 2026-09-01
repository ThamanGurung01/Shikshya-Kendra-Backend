import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const resolveSchoolId = (req: AuthenticatedRequest): string | undefined => {
  if (req.role === 'superadmin') {
    return (
      (req.body?.schoolId as string) ||
      (req.query?.schoolId as string) ||
      (req.params?.schoolId as string) ||
      (req.headers?.['x-school-id'] as string) ||
      req.schoolId
    );
  }
  return req.schoolId || (req.body?.schoolId as string) || (req.query?.schoolId as string);
};