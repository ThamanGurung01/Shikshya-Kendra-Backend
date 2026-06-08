import { SectionModel } from '../models/section.model';
import { ISectionInput } from '../validators/section.validator';

export const createSection = async (data: ISectionInput) => {
  return await SectionModel.create(data);
};

export const getAllSections = async () => {
  return await SectionModel.find().limit(20).sort({ createdAt: -1 }).lean();
};

export const getAllSectionsBySchool = async (schoolId: string) => {
  return await SectionModel.find({ schoolId }).limit(20).sort({ createdAt: -1 }).lean();
};

export const getSectionById = async (id: string) => {
  return await SectionModel.findById(id).lean();
};
//get by classId
export const getSectionsByClassId=async(classId:string)=>{
    return await SectionModel.find({classId:classId}).limit(20).sort({createdAt:-1});
}
export const updateSection = async (id: string, data: ISectionInput) => {
  return await SectionModel.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const updateSectionBySchool = async (id: string, schoolId: string, data: ISectionInput) => {
  return await SectionModel.findOneAndUpdate({ _id: id, schoolId }, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const hardDeleteSection = async (id: string) => {
  return await SectionModel.findByIdAndDelete(id);
};

export const hardDeleteSectionBySchool = async (id: string, schoolId: string) => {
  return await SectionModel.findOneAndDelete({ _id: id, schoolId });
};