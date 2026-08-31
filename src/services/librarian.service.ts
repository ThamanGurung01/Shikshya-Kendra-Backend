import { Librarian } from '../models/librarian.model';
import { ILibrarianInput } from '../validators/librarian.validator';

export const createLibrarian = async (
  data: ILibrarianInput,
  others: Record<string, unknown> = {},
  session?: any,
) => {
  const cleanOthers = Object.fromEntries(Object.entries(others).filter(([_, v]) => v !== undefined));
  const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
  const [librarian] = await Librarian.create([{ ...cleanData, ...cleanOthers }], { session });
  return librarian!;
};

export const getAllLibrariansBySchool = async (schoolId: string) => {
  return await Librarian.find({ schoolId })
    .populate('userId', 'name email profileImage role is_active').sort({ createdAt: -1 });
};

export const getLibrarianById = async (id: string) => {
  return await Librarian.findById(id)
    .populate('userId', 'name email profileImage role is_active');
};

export const updateLibrarianBySchool = async (id: string, schoolId: string, data: Partial<ILibrarianInput>) => {
  return await Librarian.findOneAndUpdate({ _id: id, schoolId }, data, {
    returnDocument: 'after',
    runValidators: true,
  });
};

export const hardDeleteLibrarianBySchool = async (id: string, schoolId: string) => {
  return await Librarian.findOneAndDelete({ _id: id, schoolId });
};
