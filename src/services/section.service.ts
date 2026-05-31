import { SectionModel } from '../models/section.model';
import { ISectionInput } from '../validators/section.validator';

export const createSection = async (data: ISectionInput) => {
  return await SectionModel.create(data);
};

export const getAllSections = async () => {
  return await SectionModel.find().limit(20).sort({ createdAt: -1 }).lean();
};

export const getSectionById = async (id: string) => {
  return await SectionModel.findById(id).lean();
};

export const updateSection = async (id: string, data: ISectionInput) => {
  return await SectionModel.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const hardDeleteSection = async (id: string) => {
  return await SectionModel.findByIdAndDelete(id);
};