import { FeeStructure, IFeeStructure } from "../models/fee-structure.model";
import { Types } from "mongoose";

export const upsertFeeStructure = async (
  schoolId: string,
  createdById: string,
  data: {
    academicYearId: string;
    classId: string;
    monthlyFee: number;
    status?: "active" | "inactive";
  }
) => {
  const existing = await FeeStructure.findOne({
    schoolId: new Types.ObjectId(schoolId),
    academicYearId: new Types.ObjectId(data.academicYearId),
    classId: new Types.ObjectId(data.classId),
    deletedAt: null,
  });

  if (existing) {
    existing.monthlyFee = data.monthlyFee;
    if (data.status) existing.status = data.status;
    return await existing.save();
  }

  return await FeeStructure.create({
    schoolId: new Types.ObjectId(schoolId),
    academicYearId: new Types.ObjectId(data.academicYearId),
    classId: new Types.ObjectId(data.classId),
    monthlyFee: data.monthlyFee,
    createdById: new Types.ObjectId(createdById),
    status: data.status || "active",
  });
};

export const getFeeStructures = async (schoolId: string, academicYearId?: string) => {
  const query: any = {
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  };
  if (academicYearId) {
    query.academicYearId = new Types.ObjectId(academicYearId);
  }

  return await FeeStructure.find(query)
    .populate("classId", "name className")
    .populate("academicYearId", "name isCurrent")
    .populate("createdById", "name email")
    .sort({ "classId.name": 1 });
};

export const getFeeStructureById = async (id: string, schoolId: string) => {
  return await FeeStructure.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  })
    .populate("classId", "name className")
    .populate("academicYearId", "name isCurrent");
};

export const deleteFeeStructure = async (id: string, schoolId: string) => {
  return await FeeStructure.findOneAndUpdate(
    { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId) },
    { deletedAt: new Date(), status: "inactive" },
    { new: true }
  );
};
