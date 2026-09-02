import { FeeInvoice } from "../models/fee-invoice.model";
import { Income } from "../models/income.model";
import { Expense } from "../models/expense.model";
import { Payroll } from "../models/payroll.model";

export async function generateReceiptNumber(schoolId: string): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `REC-${yearMonth}-`;

  const lastInvoice = await FeeInvoice.findOne({
    schoolId,
    receiptNumber: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select("receiptNumber")
    .lean();

  let nextSequence = 1;
  if (lastInvoice && lastInvoice.receiptNumber) {
    const parts = lastInvoice.receiptNumber.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const lastSeq = parseInt(lastPart, 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(5, "0")}`;
}

export async function generateIncomeVoucherNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INC-${year}-`;

  const lastIncome = await Income.findOne({
    schoolId,
    voucherNumber: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select("voucherNumber")
    .lean();

  let nextSequence = 1;
  if (lastIncome && lastIncome.voucherNumber) {
    const parts = lastIncome.voucherNumber.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const lastSeq = parseInt(lastPart, 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

export async function generateExpenseVoucherNumber(schoolId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;

  const lastExpense = await Expense.findOne({
    schoolId,
    voucherNumber: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select("voucherNumber")
    .lean();

  let nextSequence = 1;
  if (lastExpense && lastExpense.voucherNumber) {
    const parts = lastExpense.voucherNumber.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const lastSeq = parseInt(lastPart, 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

export async function generatePayrollNumber(schoolId: string, month: number, year: number): Promise<string> {
  const prefix = `PAY-${year}${String(month).padStart(2, "0")}-`;

  const lastPayroll = await Payroll.findOne({
    schoolId,
    payrollNumber: { $regex: `^${prefix}` },
  })
    .sort({ createdAt: -1 })
    .select("payrollNumber")
    .lean();

  let nextSequence = 1;
  if (lastPayroll && lastPayroll.payrollNumber) {
    const parts = lastPayroll.payrollNumber.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const lastSeq = parseInt(lastPart, 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}
