import { SubjectModel } from '../models/subject.model';
import { ISubjectInput } from '../validators/subject.validator';

export const createSubject = async (data: ISubjectInput) => {
  return await SubjectModel.create(data);
};

export const getAllSubjects = async (schoolId: string, filter?: { classId?: string | undefined }) => {
  const query: any = { schoolId };
  if (filter?.classId) {
    query.classId = filter.classId;
  }
  return await SubjectModel.find(query).sort({ name: 1 }).lean();
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

export const updateSubjectBySchool = async (id: string, schoolId: string, data: ISubjectInput) => {
  return await SubjectModel.findOneAndUpdate({ _id: id, schoolId }, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const hardDeleteSubject = async (id: string) => {
  return await SubjectModel.findByIdAndDelete(id);
};

export const hardDeleteSubjectBySchool = async (id: string, schoolId: string) => {
  return await SubjectModel.findOneAndDelete({ _id: id, schoolId });
};