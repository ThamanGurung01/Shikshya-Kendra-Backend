import { Admin } from '../models/admin.model';
import { IAdminInput } from '../validators/admin.validator';

export const createAdmin = async (
  data: IAdminInput,
  others: Record<string, unknown> = {},
  session?: any,
) => {
  const cleanOthers = Object.fromEntries(Object.entries(others).filter(([_, v]) => v !== undefined));
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  const [admin] = await Admin.create([{ ...cleanData, ...cleanOthers }], { session });
  return admin!;
};

export const getAllAdminsBySchool = async (schoolId: string) => {
  return await Admin.find({ schoolId })
    .populate('userId', 'name email profileImage role is_active -_id').sort({ createdAt: -1 });
};

export const getAdminById = async (id: string) => {
  return await Admin.findById(id)
    .populate('userId', 'name email profileImage role is_active -_id');
};

export const updateAdminBySchool = async (id: string, schoolId: string, data: Partial<IAdminInput>) => {
  return await Admin.findOneAndUpdate({ _id: id, schoolId }, data, {
    returnDocument: 'after',
    runValidators: true,
  });
};

export const hardDeleteAdminBySchool = async (id: string, schoolId: string) => {
  return await Admin.findOneAndDelete({ _id: id, schoolId });
};
