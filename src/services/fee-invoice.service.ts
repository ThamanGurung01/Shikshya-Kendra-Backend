import { FeeInvoice, IFeeInvoice } from "../models/fee-invoice.model";
import { FeeStructure } from "../models/fee-structure.model";
import { StudentFeeConfig } from "../models/student-fee-config.model";
import { FeeHead } from "../models/fee-head.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { Student } from "../models/student.model";
import { Parent } from "../models/parent.model";
import { ClassModel } from "../models/class.model";
import { SectionModel } from "../models/section.model";
import { Income } from "../models/income.model";
import { AcademicYear } from "../models/academic-year.model";
import { School } from "../models/school.model";
import { Types } from "mongoose";
import {
  generateReceiptNumber,
  generateIncomeVoucherNumber,
} from "../utils/voucher-number.util";

// Ensure populate references are active in Mongoose registry
void [Parent.modelName, ClassModel.modelName, SectionModel.modelName];

export const NEPALI_MONTHS = [
  { index: 1, name: "Baishakh" },
  { index: 2, name: "Jestha" },
  { index: 3, name: "Ashadh" },
  { index: 4, name: "Shrawan" },
  { index: 5, name: "Bhadra" },
  { index: 6, name: "Ashwin" },
  { index: 7, name: "Kartik" },
  { index: 8, name: "Mangsir" },
  { index: 9, name: "Poush" },
  { index: 10, name: "Magh" },
  { index: 11, name: "Falgun" },
  { index: 12, name: "Chaitra" },
];

export const getClassStudentsFeeSummary = async (
  schoolId: string,
  academicYearId?: string,
  classId?: string,
  sectionId?: string,
) => {
  let resolvedAcademicYearId = academicYearId;
  if (!resolvedAcademicYearId) {
    const currentYear = await AcademicYear.findOne({
      schoolId: new Types.ObjectId(schoolId),
      isCurrent: true,
    });
    if (currentYear) resolvedAcademicYearId = currentYear._id.toString();
  }

  const enrollmentQuery: any = {
    schoolId: new Types.ObjectId(schoolId),
    studentEnrollmentStatus: "active",
  };
  if (resolvedAcademicYearId) {
    enrollmentQuery.academicYearId = new Types.ObjectId(resolvedAcademicYearId);
  }
  if (classId) {
    enrollmentQuery.classId = new Types.ObjectId(classId);
  }
  if (sectionId) {
    enrollmentQuery.sectionId = new Types.ObjectId(sectionId);
  }

  const enrollments = await StudentEnrollment.find(enrollmentQuery)
    .populate({
      path: "studentId",
      populate: { path: "parentId", select: "fatherName motherName contact" },
    })
    .populate("classId", "name className")
    .populate("sectionId", "name sectionName")
    .populate("academicYearId", "name isCurrent")
    .sort({ rollNumber: 1 });

  // Pre-load class fee structures
  const feeStructures = await FeeStructure.find({
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  }).lean();
  const feeStructureMap = new Map<string, number>();
  feeStructures.forEach((fs) => {
    feeStructureMap.set(fs.classId.toString(), fs.monthlyFee);
  });

  // Pre-load student fee configs
  const studentConfigs = await StudentFeeConfig.find({
    schoolId: new Types.ObjectId(schoolId),
  }).lean();
  const studentConfigMap = new Map<string, any>();
  studentConfigs.forEach((sc) => {
    studentConfigMap.set(sc.studentId.toString(), sc);
  });

  // Pre-load student invoices
  const invoices = await FeeInvoice.find({
    schoolId: new Types.ObjectId(schoolId),
    ...(resolvedAcademicYearId && {
      academicYearId: new Types.ObjectId(resolvedAcademicYearId),
    }),
    deletedAt: null,
  }).lean();
  const studentPaidMap = new Map<string, number>();
  invoices.forEach((inv) => {
    const sId = inv.studentId.toString();
    const prev = studentPaidMap.get(sId) || 0;
    studentPaidMap.set(sId, prev + (inv.paidAmount || 0));
  });

  return enrollments.map((enr) => {
    const student = enr.studentId as any;
    const cId = enr.classId
      ? (enr.classId as any)._id?.toString() || enr.classId.toString()
      : "";
    const sId = student?._id?.toString() || "";

    const classBaseFee = feeStructureMap.get(cId) || 0;
    const configRaw = studentConfigMap.get(sId);
    const customConfig = configRaw?.status === "inactive" ? null : configRaw;

    const monthlyTuition =
      customConfig?.customMonthlyFee !== null &&
      customConfig?.customMonthlyFee !== undefined
        ? customConfig.customMonthlyFee
        : classBaseFee;

    const transportFee = customConfig?.hasTransport
      ? customConfig.transportFee || 0
      : 0;
    const baseMonthlyTotal = monthlyTuition + transportFee;

    let monthlyDiscount = 0;
    if (customConfig?.discountType === "percentage") {
      monthlyDiscount =
        (baseMonthlyTotal * (customConfig.discountValue || 0)) / 100;
    } else if (customConfig?.discountType === "flat") {
      monthlyDiscount = customConfig.discountValue || 0;
    }

    const netMonthlyFee = Math.max(0, baseMonthlyTotal - monthlyDiscount);
    const totalAnnualFee = netMonthlyFee * 12;
    const totalPaid = studentPaidMap.get(sId) || 0;
    const pendingBalance = Math.max(0, totalAnnualFee - totalPaid);

    return {
      enrollmentId: enr._id,
      studentId: sId,
      studentName: student?.studentName || "Unknown",
      admissionNumber: student?.admissionNumber || "",
      rollNumber: enr.rollNumber || null,
      classId: cId,
      className:
        (enr.classId as any)?.name || (enr.classId as any)?.className || "",
      sectionId: (enr.sectionId as any)?._id || enr.sectionId,
      sectionName:
        (enr.sectionId as any)?.name ||
        (enr.sectionId as any)?.sectionName ||
        "",
      academicYearId: (enr.academicYearId as any)?._id || enr.academicYearId,
      academicYearName: (enr.academicYearId as any)?.name || "",
      parentContact: student?.parentId?.contact || student?.contact || "N/A",
      parentName:
        student?.parentId?.fatherName || student?.parentId?.motherName || "N/A",
      discountType: customConfig?.discountType || "none",
      discountValue: customConfig?.discountValue || 0,
      discountReason: customConfig?.discountReason || "",
      hasTransport: !!customConfig?.hasTransport,
      totalAnnualFee,
      totalPaid,
      pendingBalance,
      status:
        pendingBalance <= 0
          ? "paid"
          : totalPaid > 0
            ? "partially_paid"
            : "unpaid",
    };
  });
};

export const getStudentDueSummary = async (
  schoolId: string,
  studentId: string,
  academicYearId?: string,
) => {
  let resolvedAcademicYearId = academicYearId;
  if (!resolvedAcademicYearId) {
    const currentYear = await AcademicYear.findOne({
      schoolId: new Types.ObjectId(schoolId),
      isCurrent: true,
    });
    if (currentYear) resolvedAcademicYearId = currentYear._id.toString();
  }

  const enrollment = await StudentEnrollment.findOne({
    schoolId: new Types.ObjectId(schoolId),
    studentId: new Types.ObjectId(studentId),
    studentEnrollmentStatus: "active",
    ...(resolvedAcademicYearId && {
      academicYearId: new Types.ObjectId(resolvedAcademicYearId),
    }),
  })
    .populate("classId", "name className")
    .populate("sectionId", "name sectionName")
    .populate("academicYearId", "name isCurrent");

  const student = await Student.findOne({
    _id: new Types.ObjectId(studentId),
    schoolId: new Types.ObjectId(schoolId),
  }).populate("parentId");

  if (!enrollment || !student) {
    throw new Error("Active enrollment or student record not found");
  }

  const classId = (enrollment.classId as any)._id.toString();
  const feeStructure = await FeeStructure.findOne({
    schoolId: new Types.ObjectId(schoolId),
    classId: new Types.ObjectId(classId),
    deletedAt: null,
  });
  const defaultClassMonthlyFee = feeStructure?.monthlyFee || 0;

  const configRaw = await StudentFeeConfig.findOne({
    schoolId: new Types.ObjectId(schoolId),
    studentId: new Types.ObjectId(studentId),
  });
  const customConfig = configRaw?.status === "inactive" ? null : configRaw;

  const baseMonthlyTuition =
    customConfig?.customMonthlyFee !== null &&
    customConfig?.customMonthlyFee !== undefined
      ? customConfig.customMonthlyFee
      : defaultClassMonthlyFee;

  const transportFee = customConfig?.hasTransport
    ? customConfig.transportFee || 0
    : 0;

  // Fee heads for this class
  const feeHeads = await FeeHead.find({
    schoolId: new Types.ObjectId(schoolId),
    $or: [
      { applicableClassIds: { $size: 0 } },
      { applicableClassIds: new Types.ObjectId(classId) },
    ],
  });

  // Previous invoices for this student in this academic year
  const pastInvoices = await FeeInvoice.find({
    schoolId: new Types.ObjectId(schoolId),
    studentId: new Types.ObjectId(studentId),
    ...(resolvedAcademicYearId && {
      academicYearId: new Types.ObjectId(resolvedAcademicYearId),
    }),
    deletedAt: null,
  }).sort({ paymentDate: -1 });

  const paidMonthsSet = new Set<number>();
  let totalPaidToDate = 0;
  pastInvoices.forEach((inv) => {
    totalPaidToDate += inv.paidAmount;
    inv.paidMonths?.forEach((m) => paidMonthsSet.add(m));
  });

  // Calculate 12-month ledger
  const monthlyBreakdown = NEPALI_MONTHS.map((m) => {
    const isPaid = paidMonthsSet.has(m.index);
    // Find fee heads for this month
    const applicableHeads = feeHeads.filter((fh) => {
      if (fh.feeType === "monthly") return true;
      return fh.applicableMonth === m.index;
    });

    const feeHeadsTotal = applicableHeads.reduce(
      (acc, fh) => acc + fh.defaultAmount,
      0,
    );
    const grossMonthly = baseMonthlyTuition + transportFee + feeHeadsTotal;

    let discount = 0;
    if (customConfig?.discountType === "percentage") {
      discount = (baseMonthlyTuition * (customConfig.discountValue || 0)) / 100;
    } else if (customConfig?.discountType === "flat") {
      discount = customConfig.discountValue || 0;
    }

    const netPayable = Math.max(0, grossMonthly - discount);

    return {
      monthIndex: m.index,
      monthName: m.name,
      baseTuition: baseMonthlyTuition,
      transportFee,
      feeHeads: applicableHeads.map((fh) => ({
        id: fh._id,
        title: fh.title,
        amount: fh.defaultAmount,
      })),
      feeHeadsTotal,
      grossMonthly,
      discount,
      netPayable,
      isPaid,
      status: isPaid ? "paid" : "unpaid",
    };
  });

  const schoolDoc = await School.findById(schoolId).select("school_name");
  const unpaidMonths = monthlyBreakdown.filter((m) => !m.isPaid);
  const totalAnnualCalculated = monthlyBreakdown.reduce(
    (acc, m) => acc + m.netPayable,
    0,
  );
  const currentTotalDue = Math.max(0, totalAnnualCalculated - totalPaidToDate);

  return {
    schoolName: schoolDoc?.school_name || "",
    student: {
      id: student._id,
      name: student.studentName,
      admissionNumber: student.admissionNumber,
      rollNumber: enrollment.rollNumber,
      className:
        (enrollment.classId as any)?.name ||
        (enrollment.classId as any)?.className ||
        "",
      classId,
      sectionName:
        (enrollment.sectionId as any)?.name ||
        (enrollment.sectionId as any)?.sectionName ||
        "",
      sectionId: (enrollment.sectionId as any)?._id,
      academicYearId: (enrollment.academicYearId as any)?._id,
      academicYearName: (enrollment.academicYearId as any)?.name,
      parentContact: (student.parentId as any)?.contact || student.contact,
      parentName:
        (student.parentId as any)?.fatherName ||
        (student.parentId as any)?.motherName,
      hasTransport: !!customConfig?.hasTransport,
      discountType: customConfig?.discountType || "none",
      discountValue: customConfig?.discountValue || 0,
      discountReason: customConfig?.discountReason || "",
    },
    defaultMonthlyFee: defaultClassMonthlyFee,
    baseMonthlyTuition,
    transportFee,
    totalAnnualFee: totalAnnualCalculated,
    totalPaidToDate,
    currentTotalDue,
    unpaidMonthsCount: unpaidMonths.length,
    unpaidMonths,
    monthlyBreakdown,
    pastInvoices,
  };
};

export const getStudentFeeDetailsAndHistory = async (
  schoolId: string,
  studentId: string,
  academicYearId?: string,
) => {
  return await getStudentDueSummary(schoolId, studentId, academicYearId);
};

export const collectFeePayment = async (
  schoolId: string,
  collectedById: string,
  payload: {
    academicYearId: string;
    studentId: string;
    classId: string;
    sectionId?: string | undefined;
    paidMonths: number[];
    items: Array<{
      title: string;
      month?: number | undefined;
      feeHeadId?: string | undefined;
      amount: number;
    }>;
    discountAmount?: number | undefined;
    proRatioWaiver?: number | undefined;
    proRatioReason?: string | undefined;
    paymentMethod: "cash" | "cheque" | "bank_transfer" | "esewa";
    paymentReference?: string | undefined;
    paidAmount: number;
    remarks?: string | undefined;
  },
) => {
  const receiptNumber = await generateReceiptNumber(schoolId);
  const voucherNumber = await generateIncomeVoucherNumber(schoolId);

  const subTotal = payload.items.reduce((acc, it) => acc + it.amount, 0);
  const discountAmount = payload.discountAmount || 0;
  const proRatioWaiver = payload.proRatioWaiver || 0;
  const totalAmount = Math.max(0, subTotal - discountAmount - proRatioWaiver);
  const paidAmount = payload.paidAmount;
  const dueAmount = Math.max(0, totalAmount - paidAmount);
  const status = dueAmount <= 0 ? "paid" : "partially_paid";

  // 1. Create Fee Invoice
  const invoice: any = await FeeInvoice.create({
    receiptNumber,
    schoolId: new Types.ObjectId(schoolId),
    academicYearId: new Types.ObjectId(payload.academicYearId),
    studentId: new Types.ObjectId(payload.studentId),
    classId: new Types.ObjectId(payload.classId),
    sectionId: payload.sectionId
      ? new Types.ObjectId(payload.sectionId)
      : undefined,
    paidMonths: payload.paidMonths,
    items: payload.items.map((it) => ({
      title: it.title,
      month: it.month,
      feeHeadId: it.feeHeadId ? new Types.ObjectId(it.feeHeadId) : undefined,
      amount: it.amount,
    })),
    subTotal,
    discountAmount,
    proRatioWaiver,
    proRatioReason: payload.proRatioReason,
    totalAmount,
    paidAmount,
    dueAmount,
    paymentMethod: payload.paymentMethod,
    paymentReference: payload.paymentReference,
    paymentDate: new Date(),
    status,
    remarks: payload.remarks,
    collectedBy: new Types.ObjectId(collectedById),
  });

  // 2. Automatically log an Income entry under "Student Fee"
  const student = await Student.findById(payload.studentId).select(
    "studentName admissionNumber",
  );
  const monthNames = payload.paidMonths
    .map(
      (m) => NEPALI_MONTHS.find((nm) => nm.index === m)?.name || `Month ${m}`,
    )
    .join(", ");

  const income = await Income.create({
    voucherNumber,
    schoolId: new Types.ObjectId(schoolId),
    category: "Student Fee",
    title: `Fee Collection: ${student?.studentName || "Student"} (${monthNames || "Fees"})`,
    amount: totalAmount,
    discountAmount: 0,
    netAmount: paidAmount,
    paymentMethod: payload.paymentMethod,
    date: new Date(),
    description: `Receipt: ${receiptNumber} | Adm: ${student?.admissionNumber || ""} | Ref: ${payload.paymentReference || "Counter Cash"}`,
    invoiceId: invoice._id,
    createdById: new Types.ObjectId(collectedById),
  });

  // Update invoice with incomeId
  invoice.incomeId = income._id as any;
  await invoice.save();

  return await FeeInvoice.findById(invoice._id)
    .populate("schoolId", "school_name logo_url address contact")
    .populate(
      "studentId",
      "studentName admissionNumber contact student_email documents",
    )
    .populate("classId", "name className")
    .populate("sectionId", "name sectionName")
    .populate("academicYearId", "name isCurrent")
    .populate("collectedBy", "name email");
};

export const getInvoices = async (
  schoolId: string,
  filter?: {
    search?: string | undefined;
    classId?: string | undefined;
    paymentMethod?: string | undefined;
    status?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
  },
) => {
  const query: any = {
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  };

  if (filter?.classId && Types.ObjectId.isValid(filter.classId)) {
    query.classId = new Types.ObjectId(filter.classId);
  }
  if (filter?.paymentMethod && filter.paymentMethod !== "all") {
    query.paymentMethod = filter.paymentMethod;
  }
  if (filter?.status && filter.status !== "all") {
    query.status = filter.status;
  }
  if (filter?.startDate || filter?.endDate) {
    query.paymentDate = {};
    if (filter.startDate) query.paymentDate.$gte = new Date(filter.startDate);
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      query.paymentDate.$lte = end;
    }
  }

  const invoices = await FeeInvoice.find(query)
    .populate("studentId", "studentName admissionNumber contact student_email")
    .populate("classId", "name className")
    .populate("sectionId", "name sectionName")
    .populate("collectedBy", "name email")
    .sort({ paymentDate: -1 });

  if (filter?.search) {
    const s = filter.search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.receiptNumber.toLowerCase().includes(s) ||
        (inv.studentId as any)?.studentName?.toLowerCase().includes(s) ||
        (inv.studentId as any)?.admissionNumber?.toLowerCase().includes(s),
    );
  }

  return invoices;
};

export const getInvoiceById = async (id: string, schoolId: string) => {
  return await FeeInvoice.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  })
    .populate("schoolId", "school_name logo_url address contact")
    .populate(
      "studentId",
      "studentName admissionNumber contact student_email documents parentId",
    )
    .populate("classId", "name className")
    .populate("sectionId", "name sectionName")
    .populate("academicYearId", "name isCurrent")
    .populate("collectedBy", "name email");
};

export const getMyInvoices = async (
  schoolId: string,
  userId: string,
  role: string,
) => {
  let studentIds: Types.ObjectId[] = [];

  if (role === "student") {
    const student = await Student.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (student) studentIds.push(student._id);
  } else if (role === "parent") {
    const ParentModel = (await import("../models/parent.model")).Parent;
    const parent = await ParentModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (parent) {
      const students = await Student.find({ parentId: parent._id }).select(
        "_id",
      );
      studentIds = students.map((s) => s._id);
    }
  }

  return await FeeInvoice.find({
    schoolId: new Types.ObjectId(schoolId),
    studentId: { $in: studentIds },
    deletedAt: null,
  })
    .populate("studentId", "studentName admissionNumber")
    .populate("classId", "name className")
    .populate("academicYearId", "name")
    .sort({ paymentDate: -1 });
};

export const getMyDueSummary = async (
  schoolId: string,
  userId: string,
  role: string,
  targetStudentId?: string,
) => {
  let studentId: string | null = null;

  if (targetStudentId) {
    studentId = targetStudentId;
  } else if (role === "student") {
    const student = await Student.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (student) studentId = student._id.toString();
  } else if (role === "parent") {
    const ParentModel = (await import("../models/parent.model")).Parent;
    const parent = await ParentModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (parent) {
      const student = await Student.findOne({
        parentId: parent._id,
        schoolId: new Types.ObjectId(schoolId),
      });
      if (student) studentId = student._id.toString();
    }
  }

  if (!studentId) return null;
  return await getStudentDueSummary(schoolId, studentId);
};
