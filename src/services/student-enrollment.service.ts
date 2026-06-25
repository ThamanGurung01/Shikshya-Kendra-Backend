import {StudentEnrollment} from '../models/student-enrollment.model';
import { IStudentEnrollmentInput } from '../validators/student-enrollment.model';

export type CreateEnrollmentData = IStudentEnrollmentInput & {
  joinedAt?: Date;
  leftAt?: Date;
};

export const createStudentEnrollment = async (data: CreateEnrollmentData, session?: any) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
  const [enrollment] = await StudentEnrollment.create([cleanData], { session });
  return enrollment!;
};

export const getAllStudentEnrollments = async (
  schoolId: string,
  filters: { academicYearId?: string; classId?: string; sectionId?: string } = {}
) => {
  const query: any = { schoolId };
  if (filters.academicYearId) query.academicYearId = filters.academicYearId;
  if (filters.classId) query.classId = filters.classId;
  if (filters.sectionId) query.sectionId = filters.sectionId;

  return await StudentEnrollment.find(query)
    .limit(50)
    .sort({ createdAt: -1 })
    .lean();
};

export const getStudentEnrollmentById = async (id: string) => {
  return await StudentEnrollment.findById(id).lean();
};

export const getStudentEnrollmentByStudentId = async (studentId: string) => {
  return await StudentEnrollment.findOne({ studentId })
    .populate('academicYearId', 'name startDate endDate isCurrent')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

export const getStudentEnrollmentByStudentAndAcademicYear = async (studentId: string, academicYearId: string) => {
  return await StudentEnrollment.findOne({ studentId, academicYearId })
    .populate('academicYearId', 'name startDate endDate isCurrent')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .lean();
};

export const updateStudentEnrollment = async (id: string, schoolId: string, data: Partial<IStudentEnrollmentInput>) => {
  return await StudentEnrollment.findOneAndUpdate({ _id: id, schoolId }, data, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
};

export const hardDeleteStudentEnrollment = async (id: string, schoolId: string) => {
  return await StudentEnrollment.findOneAndDelete({ _id: id, schoolId });
};

export default {
  createStudentEnrollment,
  getAllStudentEnrollments,
  getStudentEnrollmentById,
  updateStudentEnrollment,
  hardDeleteStudentEnrollment,
};
