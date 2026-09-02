import { Payroll, IPayroll } from "../models/payroll.model";
import { StaffSalaryConfig, IStaffSalaryConfig } from "../models/staff-salary-config.model";
import { Expense } from "../models/expense.model";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { generatePayrollNumber, generateExpenseVoucherNumber } from "../utils/voucher-number.util";

void User.modelName;

export const saveSalaryConfig = async (
  schoolId: string,
  data: {
    userId: string;
    staffRole: "teacher" | "accountant" | "librarian" | "admin" | "staff";
    staffRefId?: string | undefined;
    basicSalary: number;
    allowances?: Array<{ title: string; amount: number }> | undefined;
    deductions?: Array<{ title: string; amount: number }> | undefined;
    status?: "active" | "inactive" | undefined;
  }
) => {
  return await StaffSalaryConfig.findOneAndUpdate(
    {
      schoolId: new Types.ObjectId(schoolId),
      userId: new Types.ObjectId(data.userId),
    },
    {
      schoolId: new Types.ObjectId(schoolId),
      userId: new Types.ObjectId(data.userId),
      staffRole: data.staffRole,
      staffRefId: data.staffRefId ? new Types.ObjectId(data.staffRefId) : undefined,
      basicSalary: data.basicSalary,
      allowances: data.allowances || [],
      deductions: data.deductions || [],
      status: data.status || "active",
    },
    { upsert: true, new: true }
  ).populate("userId", "name email role is_active");
};

export const getSalaryConfigs = async (schoolId: string, role?: string) => {
  const query: any = {
    schoolId: new Types.ObjectId(schoolId),
  };
  if (role && role !== "all") {
    query.staffRole = role;
  }
  return await StaffSalaryConfig.find(query)
    .populate("userId", "name email role is_active")
    .sort({ createdAt: -1 });
};

export const getSalaryConfigByUser = async (userId: string, schoolId: string) => {
  return await StaffSalaryConfig.findOne({
    userId: new Types.ObjectId(userId),
    schoolId: new Types.ObjectId(schoolId),
  }).populate("userId", "name email role is_active");
};

export const deleteSalaryConfig = async (id: string, schoolId: string) => {
  return await StaffSalaryConfig.findOneAndDelete({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
  });
};

export const generateBatchPayroll = async (
  schoolId: string,
  generatedById: string,
  month: number,
  year: number
) => {
  const activeConfigs = await StaffSalaryConfig.find({
    schoolId: new Types.ObjectId(schoolId),
    status: "active",
  }).populate("userId", "name email role is_active");

  const results: any[] = [];

  for (const config of activeConfigs) {
    const existing = await Payroll.findOne({
      schoolId: new Types.ObjectId(schoolId),
      userId: config.userId._id,
      month,
      year,
    });

    if (existing) {
      results.push(existing);
      continue;
    }

    const totalAllowance = (config.allowances || []).reduce((acc, a) => acc + a.amount, 0);
    const totalDeduction = (config.deductions || []).reduce((acc, d) => acc + d.amount, 0);
    const netSalary = Math.max(0, config.basicSalary + totalAllowance - totalDeduction);

    const payrollNumber = await generatePayrollNumber(schoolId, month, year);

    const payroll = await Payroll.create({
      payrollNumber,
      schoolId: new Types.ObjectId(schoolId),
      userId: config.userId._id,
      staffRole: config.staffRole,
      month,
      year,
      basicSalary: config.basicSalary,
      totalAllowance,
      totalDeduction,
      netSalary,
      paymentStatus: "unpaid",
      generatedBy: new Types.ObjectId(generatedById),
    });

    results.push(payroll);
  }

  return await Payroll.find({
    schoolId: new Types.ObjectId(schoolId),
    month,
    year,
  })
    .populate("userId", "name email role")
    .populate("generatedBy", "name email")
    .sort({ payrollNumber: 1 });
};

export const getPayrolls = async (
  schoolId: string,
  filter?: {
    month?: number | undefined;
    year?: number | undefined;
    staffRole?: string | undefined;
    paymentStatus?: string | undefined;
  }
) => {
  const query: any = {
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  };

  if (filter?.month) query.month = Number(filter.month);
  if (filter?.year) query.year = Number(filter.year);
  if (filter?.staffRole && filter.staffRole !== "all") query.staffRole = filter.staffRole;
  if (filter?.paymentStatus && filter.paymentStatus !== "all") query.paymentStatus = filter.paymentStatus;

  return await Payroll.find(query)
    .populate("userId", "name email role")
    .populate("generatedBy", "name email")
    .sort({ year: -1, month: -1, createdAt: -1 });
};

export const disburseSalary = async (
  id: string,
  schoolId: string,
  disbursedById: string,
  data: {
    paymentMethod: "cash" | "cheque" | "bank_transfer";
    paymentDate?: string | Date | undefined;
    transactionReference?: string | undefined;
  }
) => {
  const payroll = await Payroll.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  }).populate("userId", "name email role");

  if (!payroll) throw new Error("Payroll record not found");
  if (payroll.paymentStatus === "paid") throw new Error("Salary is already disbursed for this payroll");

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

  // 1. Create an Expense entry under category "Salary"
  const voucherNumber = await generateExpenseVoucherNumber(schoolId);
  const staffName = (payroll.userId as any)?.name || "Staff Member";

  const expense = await Expense.create({
    voucherNumber,
    schoolId: new Types.ObjectId(schoolId),
    category: "Salary",
    title: `Salary Disbursement: ${staffName} (${payroll.staffRole.toUpperCase()} - Month ${payroll.month}/${payroll.year})`,
    amount: payroll.netSalary,
    discountAmount: 0,
    netAmount: payroll.netSalary,
    paymentMethod: data.paymentMethod,
    date: paymentDate,
    description: `Payroll #${payroll.payrollNumber} | Staff: ${staffName} | Ref: ${data.transactionReference || "Direct Disbursement"}`,
    payrollId: payroll._id,
    createdById: new Types.ObjectId(disbursedById),
  });

  // 2. Mark Payroll as Paid
  payroll.paymentStatus = "paid";
  payroll.paymentMethod = data.paymentMethod;
  payroll.paymentDate = paymentDate;
  payroll.transactionReference = data.transactionReference;
  payroll.expenseId = expense._id as any;
  await payroll.save();

  return await Payroll.findById(payroll._id)
    .populate("userId", "name email role")
    .populate("generatedBy", "name email")
    .populate("expenseId", "voucherNumber");
};
