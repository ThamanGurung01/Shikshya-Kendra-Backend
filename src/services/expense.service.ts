import { Expense, IExpense } from "../models/expense.model";
import { Types } from "mongoose";
import { generateExpenseVoucherNumber } from "../utils/voucher-number.util";

export const createExpense = async (
  schoolId: string,
  createdById: string,
  data: {
    category: string;
    title: string;
    amount: number;
    discountAmount?: number | undefined;
    paymentMethod?: "cash" | "bank_transfer" | "cheque" | "online" | undefined;
    date?: string | Date | undefined;
    description?: string | undefined;
    payrollId?: string | undefined;
    receiptUrl?: string | undefined;
  }
) => {
  const voucherNumber = await generateExpenseVoucherNumber(schoolId);
  const discountAmount = data.discountAmount || 0;
  const netAmount = Math.max(0, data.amount - discountAmount);

  return await Expense.create({
    voucherNumber,
    schoolId: new Types.ObjectId(schoolId),
    category: data.category,
    title: data.title,
    amount: data.amount,
    discountAmount,
    netAmount,
    paymentMethod: data.paymentMethod || "cash",
    date: data.date ? new Date(data.date) : new Date(),
    description: data.description,
    payrollId: data.payrollId ? new Types.ObjectId(data.payrollId) : undefined,
    receiptUrl: data.receiptUrl,
    createdById: new Types.ObjectId(createdById),
  });
};

export const getExpenses = async (
  schoolId: string,
  filter?: {
    category?: string | undefined;
    paymentMethod?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    search?: string | undefined;
  }
) => {
  const query: any = {
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  };

  if (filter?.category && filter.category !== "all") {
    query.category = filter.category;
  }
  if (filter?.paymentMethod && filter.paymentMethod !== "all") {
    query.paymentMethod = filter.paymentMethod;
  }
  if (filter?.startDate || filter?.endDate) {
    query.date = {};
    if (filter.startDate) query.date.$gte = new Date(filter.startDate);
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const expenses = await Expense.find(query)
    .populate("createdById", "name email")
    .populate("payrollId", "payrollNumber staffRole month year")
    .sort({ date: -1 });

  if (filter?.search) {
    const s = filter.search.toLowerCase();
    return expenses.filter(
      (exp) =>
        exp.voucherNumber.toLowerCase().includes(s) ||
        exp.title.toLowerCase().includes(s) ||
        exp.category.toLowerCase().includes(s)
    );
  }

  return expenses;
};

export const getExpenseById = async (id: string, schoolId: string) => {
  return await Expense.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  })
    .populate("createdById", "name email")
    .populate("payrollId", "payrollNumber staffRole month year");
};

export const updateExpense = async (
  id: string,
  schoolId: string,
  data: Partial<IExpense>
) => {
  if (data.amount !== undefined || data.discountAmount !== undefined) {
    const current = await Expense.findById(id);
    if (current) {
      const amt = data.amount !== undefined ? data.amount : current.amount;
      const disc = data.discountAmount !== undefined ? data.discountAmount : current.discountAmount || 0;
      data.netAmount = Math.max(0, amt - disc);
    }
  }

  return await Expense.findOneAndUpdate(
    { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId) },
    { $set: data },
    { new: true }
  ).populate("createdById", "name email");
};

export const deleteExpense = async (id: string, schoolId: string) => {
  return await Expense.findOneAndUpdate(
    { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId) },
    { deletedAt: new Date() },
    { new: true }
  );
};
