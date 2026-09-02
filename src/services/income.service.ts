import { Income, IIncome } from "../models/income.model";
import { Types } from "mongoose";
import { generateIncomeVoucherNumber } from "../utils/voucher-number.util";

export const createIncome = async (
  schoolId: string,
  createdById: string,
  data: {
    category: string;
    title: string;
    amount: number;
    discountAmount?: number | undefined;
    paymentMethod?: "cash" | "bank_transfer" | "cheque" | "esewa" | undefined;
    date?: string | Date | undefined;
    description?: string | undefined;
    receiptUrl?: string | undefined;
  }
) => {
  const voucherNumber = await generateIncomeVoucherNumber(schoolId);
  const discountAmount = data.discountAmount || 0;
  const netAmount = Math.max(0, data.amount - discountAmount);

  return await Income.create({
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
    receiptUrl: data.receiptUrl,
    createdById: new Types.ObjectId(createdById),
  });
};

export const getIncomes = async (
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

  const incomes = await Income.find(query)
    .populate("createdById", "name email")
    .sort({ date: -1 });

  if (filter?.search) {
    const s = filter.search.toLowerCase();
    return incomes.filter(
      (inc) =>
        inc.voucherNumber.toLowerCase().includes(s) ||
        inc.title.toLowerCase().includes(s) ||
        inc.category.toLowerCase().includes(s)
    );
  }

  return incomes;
};

export const getIncomeById = async (id: string, schoolId: string) => {
  return await Income.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
    deletedAt: null,
  }).populate("createdById", "name email");
};

export const updateIncome = async (
  id: string,
  schoolId: string,
  data: Partial<IIncome>
) => {
  const current = await Income.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
  });

  if (current && current.category === "Student Fee") {
    throw new Error("Student fee records cannot be edited directly from Income & Expense management.");
  }

  if (data.amount !== undefined || data.discountAmount !== undefined) {
    if (current) {
      const amt = data.amount !== undefined ? data.amount : current.amount;
      const disc = data.discountAmount !== undefined ? data.discountAmount : current.discountAmount || 0;
      data.netAmount = Math.max(0, amt - disc);
    }
  }

  return await Income.findOneAndUpdate(
    { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId) },
    { $set: data },
    { new: true }
  ).populate("createdById", "name email");
};

export const deleteIncome = async (id: string, schoolId: string) => {
  const current = await Income.findOne({
    _id: new Types.ObjectId(id),
    schoolId: new Types.ObjectId(schoolId),
  });

  if (current && current.category === "Student Fee") {
    throw new Error("Student fee records cannot be deleted directly from Income & Expense management.");
  }

  return await Income.findOneAndUpdate(
    { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId) },
    { deletedAt: new Date() },
    { new: true }
  );
};
