import { StudentFeeConfig, IStudentFeeConfig } from "../models/student-fee-config.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { Types } from "mongoose";

export const upsertStudentFeeConfig = async (
  schoolId: string,
  data: {
    studentId: string;
    customMonthlyFee?: number | null | undefined;
    discountType?: "none" | "percentage" | "flat" | undefined;
    discountValue?: number | undefined;
    discountReason?: string | undefined;
    hasTransport?: boolean | undefined;
    transportFee?: number | undefined;
    status?: "active" | "inactive" | undefined;
  }
) => {
  return await StudentFeeConfig.findOneAndUpdate(
    {
      schoolId: new Types.ObjectId(schoolId),
      studentId: new Types.ObjectId(data.studentId),
    },
    {
      schoolId: new Types.ObjectId(schoolId),
      studentId: new Types.ObjectId(data.studentId),
      customMonthlyFee: data.customMonthlyFee ?? null,
      discountType: data.discountType || "none",
      discountValue: data.discountValue || 0,
      discountReason: data.discountReason || "",
      hasTransport: data.hasTransport ?? false,
      transportFee: data.transportFee || 0,
      status: data.status || "active",
    },
    { upsert: true, new: true }
  ).populate({
    path: "studentId",
    select: "studentName admissionNumber contact student_email documents",
  });
};

export const getStudentFeeConfig = async (studentId: string, schoolId: string) => {
  return await StudentFeeConfig.findOne({
    studentId: new Types.ObjectId(studentId),
    schoolId: new Types.ObjectId(schoolId),
  }).populate({
    path: "studentId",
    select: "studentName admissionNumber contact student_email documents",
  });
};

export const getAllStudentFeeConfigs = async (schoolId: string) => {
  return await StudentFeeConfig.find({
    schoolId: new Types.ObjectId(schoolId),
  })
    .populate({
      path: "studentId",
      select: "studentName admissionNumber contact student_email documents",
    })
    .sort({ updatedAt: -1 });
};

export const getStudentFeeConfigsByClass = async (classId: string, schoolId: string) => {
  // Find active enrollments in this class
  const enrollments = await StudentEnrollment.find({
    schoolId: new Types.ObjectId(schoolId),
    classId: new Types.ObjectId(classId),
    studentEnrollmentStatus: "active",
  }).select("studentId");

  const studentIds = enrollments.map((e) => e.studentId);

  return await StudentFeeConfig.find({
    schoolId: new Types.ObjectId(schoolId),
    studentId: { $in: studentIds },
  }).populate({
    path: "studentId",
    select: "studentName admissionNumber contact student_email documents",
  });
};
