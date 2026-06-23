import { Accountant } from '../models/accountant.model';
import { IAccountantInput } from '../validators/accountant.validator';

export const createAccountant = async (
  data: IAccountantInput,
  others: Record<string, unknown> = {},
  session?: any,
) => {
  const cleanOthers = Object.fromEntries(Object.entries(others).filter(([_, v]) => v !== undefined));
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  const [accountant] = await Accountant.create([{ ...cleanData, ...cleanOthers }], { session });
  return accountant!;
};

export const getAllAccountantsBySchool = async (schoolId: string) => {
  return await Accountant.find({ schoolId })
    .populate('userId', 'name email profileImage role is_active -_id')
    .limit(20).sort({ createdAt: -1 });
};

export const getAccountantById = async (id: string) => {
  return await Accountant.findById(id)
    .populate('userId', 'name email profileImage role is_active -_id');
};

export const updateAccountantBySchool = async (id: string, schoolId: string, data: Partial<IAccountantInput>) => {
  return await Accountant.findOneAndUpdate({ _id: id, schoolId }, data, {
    returnDocument: 'after',
    runValidators: true,
  });
};

export const hardDeleteAccountantBySchool = async (id: string, schoolId: string) => {
  return await Accountant.findOneAndDelete({ _id: id, schoolId });
};
