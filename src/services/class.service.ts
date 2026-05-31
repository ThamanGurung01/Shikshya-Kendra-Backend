import { ClassModel } from '../models/class.model';
import { IClassInput } from '../validators/class.validator';

export const createClass = async (data: IClassInput) => {
  return await ClassModel.create(data);
};

export const getAllClasses = async () => {
  return await ClassModel.find().limit(20).sort({ createdAt: -1 }).lean();
};

export const getClassById = async (id: string) => {
  return await ClassModel.findById(id).lean();
};

export const updateClass = async (id: string, data: IClassInput) => {
  return await ClassModel.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const hardDeleteClass = async (id: string) => {
  return await ClassModel.findByIdAndDelete(id);
};