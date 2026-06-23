import { Teacher } from '../models/teacher.model';
import { ITeacherInput } from '../validators/teacher.validator';

export const createTeacher = async (
  data: ITeacherInput,
  others: Record<string, unknown> = {},
  session?: any,
) => {
  const cleanOthers = Object.fromEntries(Object.entries(others).filter(([_, v]) => v !== undefined));
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  const [teacher] = await Teacher.create([{ ...cleanData, ...cleanOthers }], { session });
  return teacher!;
};

export const getAllTeachersBySchool = async (schoolId: string) => {
  return await Teacher.find({ schoolId })
    .populate('userId', 'name email profileImage role is_active -_id')
    .limit(20).sort({ createdAt: -1 });
};

export const getTeacherById = async (id: string) => {
  return await Teacher.findById(id)
    .populate('userId', 'name email profileImage role is_active -_id');
};

export const updateTeacherBySchool = async (id: string, schoolId: string, data: Partial<ITeacherInput>) => {
  return await Teacher.findOneAndUpdate({ _id: id, schoolId }, data, {
    returnDocument: 'after',
    runValidators: true,
  });
};

export const hardDeleteTeacherBySchool = async (id: string, schoolId: string) => {
  return await Teacher.findOneAndDelete({ _id: id, schoolId });
};
