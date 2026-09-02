import { FeeHead, IFeeHead } from "../models/fee-head.model";
import { Types } from "mongoose";

export const createFeeHead = async (
  schoolId: string,
  data: {
    title: string;
    feeType?: "monthly" | "one_time" | "term_wise" | undefined;
    defaultAmount: number;
    applicableMonth?: number | undefined;
    applicableClassIds?: string[] | undefined;
  }
) => {
  return await FeeHead.create({
    schoolId: new Types.ObjectId(schoolId),
    title: data.title,
    feeType: data.feeType || "monthly",
    defaultAmount: data.defaultAmount,
    applicableMonth: data.applicableMonth,
    applicableClassIds: data.applicableClassIds?.map((id) => new Types.ObjectId(id)) || [],
  });
};

export const getFeeHeads = async (schoolId: string, classId?: string) => {
  const query: any = { schoolId: new Types.ObjectId(schoolId) };
  if (classId) {
    query.$or = [
      { applicableClassIds: { $size: 0 } },
      { applicableClassIds: new Types.ObjectId(classId) },
    ];
  }
  return await FeeHead.find(query)
    .populate("applicableClassIds", "className")
    .sort({ createdAt: -1 });
};

export const getFeeHeadById = async (id: string, schoolId: string) => {
  return await FeeHead.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
  }).populate("applicableClassIds", "className");
};

export const updateFeeHead = async (
  id: string,
  schoolId: string,
  data: Partial<IFeeHead>
) => {
  return await FeeHead.findOneAndUpdate(
    { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId) },
    { $set: data },
    { new: true }
  ).populate("applicableClassIds", "className");
};

export const deleteFeeHead = async (id: string, schoolId: string) => {
  return await FeeHead.findOneAndDelete({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
  });
};
