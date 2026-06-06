import { Types } from 'mongoose';
import { ClassModel } from '../models/class.model';
import { SectionModel } from '../models/section.model';
import { IClassInput } from '../validators/class.validator';

export const createClass = async (data: IClassInput) => {
  return await ClassModel.create(data);
};

export const getAllClasses = async (schoolId: string) => {
  return await ClassModel.aggregate([
    {
      $match: { schoolId: new Types.ObjectId(schoolId) },
    },
    {
      $lookup: {
        from: SectionModel.collection.name,
        localField: '_id',
        foreignField: 'classId',
        as: 'sections',
      },
    },
    {
      $addFields: {
        sectionCount: { $size: '$sections' },
      },
    },
    {
      $project: {
        sections: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 20,
    },
  ]);
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