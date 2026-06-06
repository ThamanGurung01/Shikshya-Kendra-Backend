import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const resolveSchoolId = (req: AuthenticatedRequest) => {
  if (req.role === 'superadmin') return req.body.schoolId;
  return req.schoolId;
};