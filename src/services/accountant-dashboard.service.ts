import { Income } from "../models/income.model";
import { Expense } from "../models/expense.model";
import { FeeInvoice } from "../models/fee-invoice.model";
import { FeeStructure } from "../models/fee-structure.model";
import { StudentFeeConfig } from "../models/student-fee-config.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { Student } from "../models/student.model";
import { Mail } from "../models/mail.model";
import { Class } from "../models/class.model";
import { AcademicYear } from "../models/academic-year.model";
import { Types } from "mongoose";
import { NEPALI_MONTHS } from "./fee-invoice.service";

export const getDashboardMetrics = async (
  schoolId: string,
  startDate?: string,
  endDate?: string
) => {
  const schoolObjId = new Types.ObjectId(schoolId);

  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  const hasDateFilter = Boolean(startDate || endDate);

  const incomeMatch: any = { schoolId: schoolObjId, deletedAt: null };
  if (hasDateFilter) incomeMatch.date = dateFilter;

  const expenseMatch: any = { schoolId: schoolObjId, deletedAt: null };
  if (hasDateFilter) expenseMatch.date = dateFilter;

  const invoiceMatch: any = { schoolId: schoolObjId, deletedAt: null };
  if (hasDateFilter) invoiceMatch.paymentDate = dateFilter;

  // 1. Total Incomes & Expenses
  const incomeAgg = await Income.aggregate([
    { $match: incomeMatch },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);
  const totalIncome = incomeAgg[0]?.total || 0;

  const expenseAgg = await Expense.aggregate([
    { $match: expenseMatch },
    { $group: { _id: null, total: { $sum: "$netAmount" } } },
  ]);
  const totalExpense = expenseAgg[0]?.total || 0;

  const netSurplus = totalIncome - totalExpense;

  // 2. Fee Collection
  const invoiceAgg = await FeeInvoice.aggregate([
    { $match: invoiceMatch },
    { $group: { _id: null, totalPaid: { $sum: "$paidAmount" } } },
  ]);
  const totalFeeCollected = invoiceAgg[0]?.totalPaid || 0;

  // 3. Receivables calculation across active enrollments
  const currentYear = await AcademicYear.findOne({ schoolId: schoolObjId, isCurrent: true });
  let totalReceivables = 0;

  if (currentYear) {
    const enrollments = await StudentEnrollment.find({
      schoolId: schoolObjId,
      academicYearId: currentYear._id,
      studentEnrollmentStatus: "active",
    }).select("studentId classId");

    const feeStructures = await FeeStructure.find({
      schoolId: schoolObjId,
      academicYearId: currentYear._id,
      deletedAt: null,
    }).lean();
    const feeMap = new Map<string, number>();
    feeStructures.forEach((fs) => feeMap.set(fs.classId.toString(), fs.monthlyFee));

    const configs = await StudentFeeConfig.find({ schoolId: schoolObjId }).lean();
    const configMap = new Map<string, any>();
    configs.forEach((c) => configMap.set(c.studentId.toString(), c));

    const invoices = await FeeInvoice.find({
      schoolId: schoolObjId,
      academicYearId: currentYear._id,
      deletedAt: null,
    }).lean();
    const paidMap = new Map<string, number>();
    invoices.forEach((inv) => {
      const sId = inv.studentId.toString();
      paidMap.set(sId, (paidMap.get(sId) || 0) + (inv.paidAmount || 0));
    });

    for (const enr of enrollments) {
      const sId = enr.studentId.toString();
      const cId = enr.classId.toString();
      const baseFee = feeMap.get(cId) || 0;
      const custom = configMap.get(sId);
      const tuition =
        custom?.customMonthlyFee !== null && custom?.customMonthlyFee !== undefined
          ? custom.customMonthlyFee
          : baseFee;
      const transport = custom?.hasTransport ? custom.transportFee || 0 : 0;
      let disc = 0;
      if (custom?.discountType === "percentage") {
        disc = ((tuition + transport) * (custom.discountValue || 0)) / 100;
      } else if (custom?.discountType === "flat") {
        disc = custom.discountValue || 0;
      }
      const netMonthly = Math.max(0, tuition + transport - disc);
      const totalYearly = netMonthly * 12;
      const paid = paidMap.get(sId) || 0;
      const due = Math.max(0, totalYearly - paid);
      totalReceivables += due;
    }
  }

  // 4. Today's Daybook Cash Register
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todayIncomes = await Income.find({
    schoolId: schoolObjId,
    deletedAt: null,
    date: { $gte: startOfToday, $lte: endOfToday },
  });

  const todayExpenses = await Expense.find({
    schoolId: schoolObjId,
    deletedAt: null,
    date: { $gte: startOfToday, $lte: endOfToday },
  });

  let todayCashInflow = 0;
  let todayOnlineInflow = 0;
  todayIncomes.forEach((inc) => {
    if (inc.paymentMethod === "cash") {
      todayCashInflow += inc.netAmount;
    } else {
      todayOnlineInflow += inc.netAmount;
    }
  });

  let todayCashOutflow = 0;
  todayExpenses.forEach((exp) => {
    todayCashOutflow += exp.netAmount;
  });

  const todayNetCashBalance = todayCashInflow - todayCashOutflow;

  return {
    totalIncome,
    totalExpense,
    netSurplus,
    totalFeeCollected,
    totalReceivables,
    daybook: {
      date: new Date().toISOString(),
      cashInflow: todayCashInflow,
      onlineInflow: todayOnlineInflow,
      cashOutflow: todayCashOutflow,
      netClosingCash: todayNetCashBalance,
    },
  };
};

export const getDashboardCharts = async (
  schoolId: string,
  startDate?: string,
  endDate?: string
) => {
  const schoolObjId = new Types.ObjectId(schoolId);

  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  const hasDateFilter = Boolean(startDate || endDate);

  const incomeQuery: any = { schoolId: schoolObjId, deletedAt: null };
  if (hasDateFilter) incomeQuery.date = dateFilter;

  const expenseQuery: any = { schoolId: schoolObjId, deletedAt: null };
  if (hasDateFilter) expenseQuery.date = dateFilter;

  const invoiceQuery: any = { schoolId: schoolObjId, deletedAt: null };
  if (hasDateFilter) invoiceQuery.paymentDate = dateFilter;

  // 1. 12-Month Nepali Trend
  const allIncomes = await Income.find(incomeQuery).lean();
  const allExpenses = await Expense.find(expenseQuery).lean();

  const monthlyTrend = NEPALI_MONTHS.map((m, idx) => {
    // Map Gregorian dates proportionally to Nepali calendar for visualization
    const monthIncomes = allIncomes.filter((inc) => {
      const d = new Date(inc.date);
      return (d.getMonth() + 9) % 12 + 1 === m.index;
    });
    const monthExpenses = allExpenses.filter((exp) => {
      const d = new Date(exp.date);
      return (d.getMonth() + 9) % 12 + 1 === m.index;
    });

    const income = monthIncomes.reduce((acc, i) => acc + i.netAmount, 0);
    const expense = monthExpenses.reduce((acc, e) => acc + e.netAmount, 0);

    return {
      month: m.name,
      monthIndex: m.index,
      income,
      expense,
      net: income - expense,
    };
  });

  // 2. Payment Method Distribution
  const paymentMethodsAgg = await FeeInvoice.aggregate([
    { $match: invoiceQuery },
    { $group: { _id: "$paymentMethod", total: { $sum: "$paidAmount" }, count: { $sum: 1 } } },
  ]);

  const paymentMethods = [
    { method: "Cash", key: "cash", total: 0, count: 0 },
    { method: "eSewa Online", key: "esewa", total: 0, count: 0 },
    { method: "Bank Transfer", key: "bank_transfer", total: 0, count: 0 },
    { method: "Cheque", key: "cheque", total: 0, count: 0 },
  ];

  paymentMethodsAgg.forEach((agg) => {
    const item = paymentMethods.find((pm) => pm.key === agg._id);
    if (item) {
      item.total = agg.total;
      item.count = agg.count;
    }
  });

  // 3. Expense Category Breakdown
  const expenseCatAgg = await Expense.aggregate([
    { $match: expenseQuery },
    { $group: { _id: "$category", total: { $sum: "$netAmount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);

  const expenseBreakdown = expenseCatAgg.map((cat) => ({
    category: cat._id,
    amount: cat.total,
    count: cat.count,
  }));

  // 4. Class-wise Fee Collection Progress
  const classes = await Class.find({ schoolId: schoolObjId }).sort({ className: 1 }).lean();
  const classProgress = await Promise.all(
    classes.map(async (cls) => {
      const classInvoiceQuery = { ...invoiceQuery, classId: cls._id };
      const invoices = await FeeInvoice.find(classInvoiceQuery).lean();

      const collected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);

      // Estimate due based on base fee structure
      const feeStructure = await FeeStructure.findOne({
        schoolId: schoolObjId,
        classId: cls._id,
        deletedAt: null,
      }).lean();
      const countStudents = await StudentEnrollment.countDocuments({
        schoolId: schoolObjId,
        classId: cls._id,
        studentEnrollmentStatus: "active",
      });

      const totalExpected = (feeStructure?.monthlyFee || 0) * 12 * countStudents;
      const due = Math.max(0, totalExpected - collected);

      return {
        classId: cls._id,
        className: cls.name || (cls as any).className || "Class",
        studentCount: countStudents,
        collected,
        due,
      };
    })
  );

  return {
    monthlyTrend,
    paymentMethods,
    expenseBreakdown,
    classProgress,
  };
};

export const getFinancialStatementReport = async (
  schoolId: string,
  startDate?: string,
  endDate?: string
) => {
  const schoolObjId = new Types.ObjectId(schoolId);
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  const query: any = { schoolId: schoolObjId, deletedAt: null };
  if (startDate || endDate) query.date = dateFilter;

  const incomes = await Income.find(query).sort({ date: -1 }).lean();

  const expenseQuery: any = { schoolId: schoolObjId, deletedAt: null };
  if (startDate || endDate) expenseQuery.date = dateFilter;
  const expenses = await Expense.find(expenseQuery).sort({ date: -1 }).lean();

  const invoiceQuery: any = { schoolId: schoolObjId, deletedAt: null };
  if (startDate || endDate) invoiceQuery.paymentDate = dateFilter;
  const invoices = await FeeInvoice.find(invoiceQuery).populate("studentId", "studentName").lean();

  const totalIncome = incomes.reduce((acc, i) => acc + i.netAmount, 0);
  const totalExpense = expenses.reduce((acc, e) => acc + e.netAmount, 0);
  const totalStudentFees = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);

  // Group incomes by category
  const incomeByCategory: Record<string, number> = {};
  incomes.forEach((inc) => {
    incomeByCategory[inc.category] = (incomeByCategory[inc.category] || 0) + inc.netAmount;
  });

  // Group expenses by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((exp) => {
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.netAmount;
  });

  return {
    generatedAt: new Date().toISOString(),
    period: {
      startDate: startDate || "All Time",
      endDate: endDate || "Present",
    },
    summary: {
      totalRevenue: totalIncome,
      totalExpenses: totalExpense,
      netSurplus: totalIncome - totalExpense,
      totalStudentFeesCollected: totalStudentFees,
    },
    incomeByCategory,
    expenseByCategory,
    recentIncomes: incomes.slice(0, 20),
    recentExpenses: expenses.slice(0, 20),
    recentInvoices: invoices.slice(0, 20),
  };
};


