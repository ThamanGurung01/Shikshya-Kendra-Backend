import mongoose, { Types } from "mongoose";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { Student } from "../models/student.model";
import { AcademicYear } from "../models/academic-year.model"; // wait, let's check exact import path
import { Class } from "../models/class.model";
import { Section } from "../models/section.model";
import { FeeInvoice } from "../models/fee-invoice.model";
import { ResultModel } from "../models/result.model";
import { IBulkPromotionInput } from "../validators/student-promotion.validator";

export const getPromotionEligibility = async (
  schoolId: string,
  sourceAcademicYearId: string,
  sourceClassId: string,
  sourceSectionId?: string,
  targetAcademicYearId?: string,
) => {
  const query: any = {
    schoolId: new Types.ObjectId(schoolId),
    academicYearId: new Types.ObjectId(sourceAcademicYearId),
    classId: new Types.ObjectId(sourceClassId),
  };

  if (sourceSectionId && sourceSectionId !== "all") {
    query.sectionId = new Types.ObjectId(sourceSectionId);
  }

  const enrollments = await StudentEnrollment.find(query)
    .populate({
      path: "studentId",
      select: "studentName admissionNumber gender contact userId parentId status",
      populate: { path: "userId", select: "email profileImage" },
    })
    .populate("classId", "name")
    .populate("sectionId", "name")
    .lean();

  if (!enrollments || enrollments.length === 0) {
    return [];
  }

  const studentIds = enrollments.map((e: any) => e.studentId?._id).filter(Boolean);

  // Check pending fees for students
  const pendingInvoices = await FeeInvoice.aggregate([
    {
      $match: {
        schoolId: new Types.ObjectId(schoolId),
        studentId: { $in: studentIds },
        dueAmount: { $gt: 0 },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: "$studentId",
        totalPendingAmount: { $sum: "$dueAmount" },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  const pendingFeeMap = new Map<string, { totalPendingAmount: number; invoiceCount: number }>();
  pendingInvoices.forEach((inv) => {
    pendingFeeMap.set(inv._id.toString(), {
      totalPendingAmount: inv.totalPendingAmount,
      invoiceCount: inv.invoiceCount,
    });
  });

  // Check target year existing enrollments if targetAcademicYearId provided
  const targetEnrollmentMap = new Map<string, any>();
  if (targetAcademicYearId) {
    const existingTargetEnrollments = await StudentEnrollment.find({
      schoolId: new Types.ObjectId(schoolId),
      academicYearId: new Types.ObjectId(targetAcademicYearId),
      studentId: { $in: studentIds },
    })
      .populate("classId", "name")
      .populate("sectionId", "name")
      .lean();

    existingTargetEnrollments.forEach((e: any) => {
      targetEnrollmentMap.set(e.studentId.toString(), e);
    });
  }

  // Fetch results for academic year
  const results = await ResultModel.find({
    schoolId: new Types.ObjectId(schoolId),
    academicYearId: new Types.ObjectId(sourceAcademicYearId),
    status: "published",
  }).lean();

  // Sort by publishedAt descending to prioritize the latest exam score
  results.sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

  const studentResultMap = new Map<string, { comprehensiveScore?: number; examScore?: number }>();
  results.forEach((res) => {
    if (res.wlmScores) {
      res.wlmScores.forEach((wlm: any) => {
        const sId = wlm.studentId.toString();
        // Only set if not already set by a more recent exam
        if (!studentResultMap.has(sId)) {
          studentResultMap.set(sId, {
            comprehensiveScore: wlm.comprehensiveScore,
            examScore: wlm.examScore,
          });
        }
      });
    }
  });

  return enrollments.map((e: any) => {
    const sId = e.studentId?._id?.toString() || "";
    const feeInfo = pendingFeeMap.get(sId);
    const existingTarget = targetEnrollmentMap.get(sId);
    const resInfo = studentResultMap.get(sId);

    return {
      enrollmentId: e._id,
      studentId: sId,
      studentName: e.studentId?.studentName || "N/A",
      admissionNumber: e.studentId?.admissionNumber || "N/A",
      email: e.studentId?.userId?.email || null,
      profileImage: e.studentId?.userId?.profileImage || null,
      currentRollNumber: e.rollNumber || null,
      currentClass: e.classId,
      currentSection: e.sectionId,
      enrollmentStatus: e.studentEnrollmentStatus || "active",
      studentStatus: e.studentId?.status || "active",
      hasPendingFees: !!feeInfo && feeInfo.totalPendingAmount > 0,
      pendingFeeAmount: feeInfo ? feeInfo.totalPendingAmount : 0,
      alreadyEnrolledInTarget: !!existingTarget && existingTarget.studentEnrollmentStatus === "active",
      targetEnrollmentDetails: existingTarget
        ? {
            class: existingTarget.classId,
            section: existingTarget.sectionId,
            rollNumber: existingTarget.rollNumber,
            status: existingTarget.studentEnrollmentStatus,
          }
        : null,
      performance: {
        comprehensiveScore: resInfo?.comprehensiveScore ?? null,
        examScore: resInfo?.examScore ?? null,
      },
    };
  });
};

export const executeBulkPromotion = async (
  schoolId: string,
  payload: IBulkPromotionInput,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const schoolObjId = new Types.ObjectId(schoolId);
    const sourceYearId = new Types.ObjectId(payload.sourceAcademicYearId);
    const targetYearId = new Types.ObjectId(payload.targetAcademicYearId);
    const defaultTargetClassId = new Types.ObjectId(payload.targetClassId);
    const defaultTargetSectionId = new Types.ObjectId(payload.targetSectionId);

    const promotedRecords: any[] = [];

    const sourceYear = await AcademicYear.findById(sourceYearId).session(session);
    const leftAtDate = sourceYear?.endDate ? new Date(sourceYear.endDate) : new Date();

    const maxRollPerSection = new Map<string, number>();

    const getNextRollNumber = async (sectionId: string, classId: string) => {
      if (!maxRollPerSection.has(sectionId)) {
        const highestEnrollment = await StudentEnrollment.findOne({
          schoolId: schoolObjId,
          academicYearId: targetYearId,
          classId: new Types.ObjectId(classId),
          sectionId: new Types.ObjectId(sectionId),
        })
          .sort("-rollNumber")
          .select("rollNumber")
          .session(session);
        maxRollPerSection.set(sectionId, highestEnrollment?.rollNumber || 0);
      }
      const nextRoll = maxRollPerSection.get(sectionId)! + 1;
      maxRollPerSection.set(sectionId, nextRoll);
      return nextRoll;
    };

    for (const item of payload.promotions) {
      const studentObjId = new Types.ObjectId(item.studentId);

      // 1. Find existing active source enrollment
      const sourceEnrollment = await StudentEnrollment.findOne({
        schoolId: schoolObjId,
        academicYearId: sourceYearId,
        studentId: studentObjId,
        studentEnrollmentStatus: "active",
      }).session(session);

      const statusMap: Record<string, "promoted" | "failed" | "graduated"> = {
        promote: "promoted",
        retain: "failed",
        graduate: "graduated",
      };

      const newSourceStatus = statusMap[item.action] || "promoted";

      if (sourceEnrollment) {
        sourceEnrollment.studentEnrollmentStatus = newSourceStatus;
        sourceEnrollment.leftAt = leftAtDate;
        await sourceEnrollment.save({ session });
      }

      if (item.action === "graduate") {
        await Student.updateOne(
          { _id: studentObjId, schoolId: schoolObjId },
          { $set: { status: "graduated" } },
          { session },
        );

        // If target enrollment exists in target academic year, update it to graduated so student is no longer active in target year
        const targetEnrollment = await StudentEnrollment.findOne({
          schoolId: schoolObjId,
          academicYearId: targetYearId,
          studentId: studentObjId,
        }).session(session);

        if (targetEnrollment) {
          targetEnrollment.studentEnrollmentStatus = "graduated";
          targetEnrollment.leftAt = leftAtDate;
          await targetEnrollment.save({ session });
        }

        promotedRecords.push({
          studentId: item.studentId,
          action: "graduate",
          status: "graduated",
        });
        continue;
      }

      // Only set status to active if they were wrongly marked as graduated
      await Student.updateOne(
        { _id: studentObjId, schoolId: schoolObjId, status: "graduated" },
        { $set: { status: "active" } },
        { session },
      );

      // Determine target class & section
      const targetClassId =
        item.action === "retain"
          ? new Types.ObjectId(payload.sourceClassId)
          : defaultTargetClassId;

      let targetSectionId: Types.ObjectId;
      if (item.action === "retain") {
        if (sourceEnrollment?.sectionId) {
          targetSectionId = sourceEnrollment.sectionId as Types.ObjectId;
        } else if (payload.sourceSectionId) {
          targetSectionId = new Types.ObjectId(payload.sourceSectionId);
        } else {
          throw new Error(`Cannot determine section for retained student ${item.studentId}`);
        }
      } else {
        targetSectionId = item.targetSectionId
          ? new Types.ObjectId(item.targetSectionId)
          : defaultTargetSectionId;
      }

      let rollNumber = item.targetRollNumber;
      if (rollNumber == null) {
        rollNumber = await getNextRollNumber(targetSectionId.toString(), targetClassId.toString());
      } else {
        const currentMax = maxRollPerSection.get(targetSectionId.toString()) || 0;
        if (rollNumber > currentMax) {
          maxRollPerSection.set(targetSectionId.toString(), rollNumber);
        }
      }

      // Check if target enrollment already exists
      let targetEnrollment = await StudentEnrollment.findOne({
        schoolId: schoolObjId,
        academicYearId: targetYearId,
        studentId: studentObjId,
      }).session(session);

      if (targetEnrollment) {
        targetEnrollment.classId = targetClassId;
        targetEnrollment.sectionId = targetSectionId;
        targetEnrollment.rollNumber = rollNumber;
        targetEnrollment.studentEnrollmentStatus = "active";
        if (sourceEnrollment) {
          targetEnrollment.promotedFromEnrollmentId = sourceEnrollment._id as Types.ObjectId;
        }
        await targetEnrollment.save({ session });
      } else {
        const newEnrollmentData: any = {
          schoolId: schoolObjId,
          studentId: studentObjId,
          academicYearId: targetYearId,
          classId: targetClassId,
          sectionId: targetSectionId,
          rollNumber,
          studentEnrollmentStatus: "active",
          joinedAt: new Date(),
        };
        if (sourceEnrollment) {
          newEnrollmentData.promotedFromEnrollmentId = sourceEnrollment._id;
        }

        const createdDocs = await StudentEnrollment.create([newEnrollmentData], { session });
        targetEnrollment = createdDocs[0] as any;
      }

      promotedRecords.push({
        studentId: item.studentId,
        action: item.action,
        enrollmentId: (targetEnrollment as any)?._id,
        classId: targetClassId,
        sectionId: targetSectionId,
        rollNumber,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      processedCount: promotedRecords.length,
      records: promotedRecords,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getStudentAcademicHistory = async (schoolId: string, studentId: string) => {
  const student = await Student.findOne({
    _id: new Types.ObjectId(studentId),
    schoolId: new Types.ObjectId(schoolId),
  })
    .populate("userId", "email profileImage name")
    .populate("parentId")
    .lean();

  if (!student) {
    return null;
  }

  const enrollments = await StudentEnrollment.find({
    schoolId: new Types.ObjectId(schoolId),
    studentId: new Types.ObjectId(studentId),
  })
    .populate("academicYearId", "name startDate endDate isCurrent")
    .populate("classId", "name")
    .populate("sectionId", "name")
    .populate({
      path: "promotedFromEnrollmentId",
      populate: [{ path: "classId", select: "name" }, { path: "academicYearId", select: "name" }],
    })
    .sort({ createdAt: 1 })
    .lean();

  const history = await Promise.all(
    enrollments.map(async (e: any) => {
      const yearId = e.academicYearId?._id;
      let invoices: any[] = [];
      let results: any[] = [];

      if (yearId) {
        invoices = await FeeInvoice.find({
          schoolId: new Types.ObjectId(schoolId),
          studentId: new Types.ObjectId(studentId),
          academicYearId: yearId,
          deletedAt: null,
        })
          .select("receiptNumber totalAmount paidAmount dueAmount status paymentDate")
          .lean();

        results = await ResultModel.find({
          schoolId: new Types.ObjectId(schoolId),
          academicYearId: yearId,
          status: "published",
        })
          .select("name wlmScores publishedAt")
          .lean();
      }

      const yearScores = results.flatMap((r) =>
        (r.wlmScores || [])
          .filter((w: any) => w.studentId.toString() === studentId)
          .map((w: any) => ({
            examName: r.name,
            examScore: w.examScore,
            attendanceScore: w.attendanceScore,
            assignmentScore: w.assignmentScore,
            comprehensiveScore: w.comprehensiveScore,
          })),
      );

      const totalFeesPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
      const totalFeesDue = invoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);

      return {
        enrollmentId: e._id,
        academicYear: e.academicYearId,
        class: e.classId,
        section: e.sectionId,
        rollNumber: e.rollNumber,
        status: e.studentEnrollmentStatus,
        promotedFrom: e.promotedFromEnrollmentId
          ? {
              enrollmentId: e.promotedFromEnrollmentId._id,
              class: e.promotedFromEnrollmentId.classId?.name,
              academicYear: e.promotedFromEnrollmentId.academicYearId?.name,
            }
          : null,
        joinedAt: e.joinedAt,
        leftAt: e.leftAt,
        financials: {
          totalFeesPaid,
          totalFeesDue,
          invoiceCount: invoices.length,
        },
        academicScores: yearScores,
      };
    }),
  );

  return {
    student: {
      _id: student._id,
      admissionNumber: student.admissionNumber,
      studentName: student.studentName,
      gender: student.gender,
      dob: student.dob,
      contact: student.contact,
      status: student.status,
      email: (student as any).userId?.email,
      profileImage: (student as any).userId?.profileImage,
    },
    timeline: history,
  };
};
