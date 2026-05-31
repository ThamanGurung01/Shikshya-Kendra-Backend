import { SubjectModel } from '../models/subject.model';
import { ISubjectInput } from '../validators/subject.validator';

export const createSubject = async (data: ISubjectInput) => {
  return await SubjectModel.create(data);
};

export const getAllSubjects = async () => {
  return await SubjectModel.find().limit(20).sort({ createdAt: -1 }).lean();
};

export const getSubjectById = async (id: string) => {
  return await SubjectModel.findById(id).lean();
};

export const updateSubject = async (id: string, data: ISubjectInput) => {
  return await SubjectModel.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const hardDeleteSubject = async (id: string) => {
  return await SubjectModel.findByIdAndDelete(id);
};