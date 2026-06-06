import { ClassModel } from '../models/class.model';
import { SectionModel } from '../models/section.model';
import { IClassInput } from '../validators/class.validator';

export const createClass = async (data: IClassInput) => {
  return await ClassModel.create(data);
};

export const getAllClasses = async (schoolId: string) => {
  return await ClassModel.find({ schoolId }).limit(20).sort({ createdAt: -1 }).lean();
};

export const getClassById = async (id: string) => {
  return await ClassModel.findById(id).lean();
};
export const getClassesByClassIds = async(id:string)=>{
  return await SectionModel.find({classId:id}).lean().countDocuments();
}
export const updateClass = async (id: string, data: IClassInput) => {
  return await ClassModel.findByIdAndUpdate(id, data, {
    returnDocument: 'after',
    runValidators: true,
  }).lean();
};

export const hardDeleteClass = async (id: string) => {
  return await ClassModel.findByIdAndDelete(id);
};