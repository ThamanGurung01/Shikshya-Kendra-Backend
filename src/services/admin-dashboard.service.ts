import { Types } from 'mongoose';
import { Student } from '../models/student.model';
import { Teacher } from '../models/teacher.model';
import { Parent } from '../models/parent.model';
import { Accountant } from '../models/accountant.model';
import { Librarian } from '../models/librarian.model';
import { Admin } from '../models/admin.model';
import { Class } from '../models/class.model';
import { Section } from '../models/section.model';
import { SubjectModel } from '../models/subject.model';
import { ExamModel } from '../models/exam.model';
import { ResultModel } from '../models/result.model';
import { Book } from '../models/book.model';
import { BookIssueModel } from '../models/book-issue.model';
import { FeeInvoice } from '../models/fee-invoice.model';
import { Income } from '../models/income.model';
import { Expense } from '../models/expense.model';
import { Attendance } from '../models/attendance.model';
import { Announcement } from '../models/announcement.model';
import { CalendarEvent } from '../models/calendar-event.model';
import { AcademicYear } from '../models/academic-year.model';
import { StudentEnrollment } from '../models/student-enrollment.model';
import { FeeStructure } from '../models/fee-structure.model';
import { StudentFeeConfig } from '../models/student-fee-config.model';

export const getAdminDashboardStats = async (schoolId: string) => {
  const schoolObjId = new Types.ObjectId(schoolId);

  // 1. Current Academic Year
  const currentAcademicYear = await AcademicYear.findOne({
    schoolId: schoolObjId,
    isCurrent: true,
  }).lean();

  // 2. Parallel queries for counts & overview data
  const [
    totalStudents,
    maleStudents,
    femaleStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    distinctParentIds,
    totalAccountants,
    totalLibrarians,
    totalAdmins,
    totalClasses,
    totalSections,
    totalSubjects,
    totalExams,
    upcomingExamsCount,
    activeExamsCount,
    endedExamsCount,
  ] = await Promise.all([
    Student.countDocuments({ schoolId: schoolObjId, deletedAt: null }),
    Student.countDocuments({ schoolId: schoolObjId, gender: { $regex: /^male$/i }, deletedAt: null }),
    Student.countDocuments({ schoolId: schoolObjId, gender: { $regex: /^female$/i }, deletedAt: null }),
    Student.countDocuments({ schoolId: schoolObjId, status: 'active', deletedAt: null }),
    Teacher.countDocuments({ schoolId: schoolObjId, deletedAt: null }),
    Teacher.countDocuments({ schoolId: schoolObjId, status: 'active', deletedAt: null }),
    Student.distinct('parentId', { schoolId: schoolObjId, parentId: { $ne: null }, deletedAt: null }),
    Accountant.countDocuments({ schoolId: schoolObjId, deletedAt: null }),
    Librarian.countDocuments({ schoolId: schoolObjId, deletedAt: null }),
    Admin.countDocuments({ schoolId: schoolObjId, deletedAt: null }),
    Class.countDocuments({ schoolId: schoolObjId }),
    Section.countDocuments({ schoolId: schoolObjId }),
    SubjectModel.countDocuments({ schoolId: schoolObjId }),
    ExamModel.countDocuments({ schoolId: schoolObjId }),
    ExamModel.countDocuments({ schoolId: schoolObjId, status: 'upcoming' }),
    ExamModel.countDocuments({ schoolId: schoolObjId, status: 'active' }),
    ExamModel.countDocuments({ schoolId: schoolObjId, status: 'ended' }),
  ]);

  const totalParents = distinctParentIds.length;

  // 3. Library Statistics
  const [booksSummary, activeBookIssues, overdueBookIssues] = await Promise.all([
    Book.aggregate([
      { $match: { schoolId: schoolObjId } },
      {
        $group: {
          _id: null,
          totalTitles: { $sum: 1 },
          totalCopies: { $sum: '$numberOfCopies' },
          availableCopies: { $sum: '$availableCopies' },
        },
      },
    ]),
    BookIssueModel.countDocuments({ schoolId: schoolObjId, status: 'Issued' }),
    BookIssueModel.countDocuments({
      schoolId: schoolObjId,
      status: { $in: ['Issued', 'Overdue'] },
      dueDate: { $lt: new Date() },
    }),
  ]);

  const totalBookTitles = booksSummary[0]?.totalTitles || 0;
  const totalBookCopies = booksSummary[0]?.totalCopies || 0;
  const availableBookCopies = booksSummary[0]?.availableCopies || 0;
  const borrowedBookCopies = Math.max(0, totalBookCopies - availableBookCopies);

  // 4. Financial Statistics
  const [incomeAgg, expenseAgg, feeCollectedAgg] = await Promise.all([
    Income.aggregate([
      { $match: { schoolId: schoolObjId, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } },
    ]),
    Expense.aggregate([
      { $match: { schoolId: schoolObjId, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } },
    ]),
    FeeInvoice.aggregate([
      { $match: { schoolId: schoolObjId, deletedAt: null } },
      { $group: { _id: null, totalPaid: { $sum: '$paidAmount' } } },
    ]),
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;
  const totalFeeCollected = feeCollectedAgg[0]?.totalPaid || 0;
  const netSurplus = totalIncome - totalExpense;

  // Calculate Fee Receivables for active enrollments
  let totalReceivables = 0;
  if (currentAcademicYear) {
    try {
      const enrollments = await StudentEnrollment.find({
        schoolId: schoolObjId,
        academicYearId: currentAcademicYear._id,
        studentEnrollmentStatus: 'active',
      }).select('studentId classId');

      const feeStructures = await FeeStructure.find({
        schoolId: schoolObjId,
        academicYearId: currentAcademicYear._id,
        deletedAt: null,
      }).lean();
      const feeMap = new Map<string, number>();
      feeStructures.forEach((fs) => feeMap.set(fs.classId.toString(), fs.monthlyFee));

      const configs = await StudentFeeConfig.find({ schoolId: schoolObjId }).lean();
      const configMap = new Map<string, any>();
      configs.forEach((c) => configMap.set(c.studentId.toString(), c));

      const invoices = await FeeInvoice.find({
        schoolId: schoolObjId,
        academicYearId: currentAcademicYear._id,
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
        if (custom?.discountType === 'percentage') {
          disc = ((tuition + transport) * (custom.discountValue || 0)) / 100;
        } else if (custom?.discountType === 'flat') {
          disc = custom.discountValue || 0;
        }
        const netMonthly = Math.max(0, tuition + transport - disc);
        const totalYearly = netMonthly * 12;
        const paid = paidMap.get(sId) || 0;
        const due = Math.max(0, totalYearly - paid);
        totalReceivables += due;
      }
    } catch (err) {
      console.error('Error calculating receivables:', err);
    }
  }

  // 5. Monthly Trend (Past 6 months)
  const now = new Date();
  const monthlyFinanceTrend: { month: string; income: number; expense: number; net: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthName = startOfMonth.toLocaleString('default', { month: 'short' });

    const [monthIncomeAgg, monthExpenseAgg] = await Promise.all([
      Income.aggregate([
        {
          $match: {
            schoolId: schoolObjId,
            deletedAt: null,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$netAmount' } } },
      ]),
      Expense.aggregate([
        {
          $match: {
            schoolId: schoolObjId,
            deletedAt: null,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$netAmount' } } },
      ]),
    ]);

    const inc = monthIncomeAgg[0]?.total || 0;
    const exp = monthExpenseAgg[0]?.total || 0;
    monthlyFinanceTrend.push({
      month: monthName,
      income: inc,
      expense: exp,
      net: inc - exp,
    });
  }

  // 6. Student Enrollment by Class
  const classes = await Class.find({ schoolId: schoolObjId }).sort({ name: 1 }).lean();
  const studentEnrollmentByClass = await Promise.all(
    classes.map(async (cls) => {
      let count = 0;
      if (currentAcademicYear) {
        count = await StudentEnrollment.countDocuments({
          schoolId: schoolObjId,
          academicYearId: currentAcademicYear._id,
          classId: cls._id,
          studentEnrollmentStatus: 'active',
        });
      }
      return {
        classId: cls._id.toString(),
        className: cls.name,
        studentCount: count,
      };
    })
  );

  // 7. Today's or Most Recent Daily Attendance
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  let attendanceDocs = await Attendance.find({
    schoolId: schoolObjId,
    date: { $gte: startOfToday, $lte: endOfToday },
  }).lean();

  let attendanceDateLabel = 'Today';

  // If no attendance recorded today, get the most recent date
  if (attendanceDocs.length === 0) {
    const latestAttendance = await Attendance.findOne({ schoolId: schoolObjId })
      .sort({ date: -1 })
      .lean();

    if (latestAttendance) {
      const recDate = new Date(latestAttendance.date);
      const recStart = new Date(recDate);
      recStart.setHours(0, 0, 0, 0);
      const recEnd = new Date(recDate);
      recEnd.setHours(23, 59, 59, 999);

      attendanceDocs = await Attendance.find({
        schoolId: schoolObjId,
        date: { $gte: recStart, $lte: recEnd },
      }).lean();

      attendanceDateLabel = recDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;

  attendanceDocs.forEach((att) => {
    (att.records || []).forEach((rec: any) => {
      if (rec.status === 'PRESENT') presentCount++;
      else if (rec.status === 'ABSENT') absentCount++;
      else if (rec.status === 'LATE') lateCount++;
      else if (rec.status === 'HALF_DAY') halfDayCount++;
    });
  });

  const totalAttendanceRecords = presentCount + absentCount + lateCount + halfDayCount;
  const attendancePercentage =
    totalAttendanceRecords > 0
      ? Math.round(((presentCount + halfDayCount * 0.5) / totalAttendanceRecords) * 100)
      : 0;

  // 8. Recent Feeds & Activity Highlights
  const [recentExams, recentResults, recentBookIssues, recentInvoices, recentAnnouncements, upcomingEvents] =
    await Promise.all([
      ExamModel.find({ schoolId: schoolObjId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('classes', 'name')
        .lean(),

      ResultModel.find({ schoolId: schoolObjId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('examId', 'name startDate endDate')
        .lean(),

      BookIssueModel.find({ schoolId: schoolObjId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('bookId', 'title')
        .populate('borrowerId', 'name email role')
        .lean(),

      FeeInvoice.find({ schoolId: schoolObjId, deletedAt: null })
        .sort({ paymentDate: -1, createdAt: -1 })
        .limit(5)
        .populate('studentId', 'studentName admissionNumber')
        .populate('classId', 'name')
        .lean(),

      Announcement.find({ schoolId: schoolObjId })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      CalendarEvent.find({ schoolId: schoolObjId, endDate: { $gte: startOfToday } })
        .sort({ startDate: 1 })
        .limit(3)
        .lean(),
    ]);

  // Format Results with average stats
  const formattedResults = recentResults.map((res: any) => {
    const scores = res.wlmScores || [];
    const count = scores.length;
    let avgCompScore = 0;
    if (count > 0) {
      const sum = scores.reduce((acc: number, s: any) => acc + (s.comprehensiveScore || 0), 0);
      avgCompScore = Math.round(sum / count);
    }
    return {
      _id: res._id,
      name: res.name,
      status: res.status,
      publishedAt: res.publishedAt,
      examName: res.examId?.name || 'N/A',
      studentCount: count,
      avgCompScore,
      createdAt: res.createdAt,
    };
  });

  return {
    academicYear: currentAcademicYear ? { _id: currentAcademicYear._id, year: (currentAcademicYear as any).year || (currentAcademicYear as any).name } : null,
    counts: {
      students: {
        total: totalStudents,
        male: maleStudents,
        female: femaleStudents,
        active: activeStudents,
      },
      teachers: {
        total: totalTeachers,
        active: activeTeachers,
      },
      parents: {
        total: totalParents,
      },
      staff: {
        accountants: totalAccountants,
        librarians: totalLibrarians,
        admins: totalAdmins,
        total: totalAccountants + totalLibrarians + totalAdmins,
      },
      academics: {
        classes: totalClasses,
        sections: totalSections,
        subjects: totalSubjects,
      },
      exams: {
        total: totalExams,
        upcoming: upcomingExamsCount,
        active: activeExamsCount,
        ended: endedExamsCount,
      },
      library: {
        titles: totalBookTitles,
        copies: totalBookCopies,
        available: availableBookCopies,
        borrowed: borrowedBookCopies,
        overdue: overdueBookIssues,
      },
      finance: {
        totalIncome,
        totalExpense,
        netSurplus,
        totalFeeCollected,
        totalReceivables,
      },
      attendance: {
        dateLabel: attendanceDateLabel,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        halfDay: halfDayCount,
        total: totalAttendanceRecords,
        percentage: attendancePercentage,
      },
    },
    charts: {
      studentEnrollmentByClass,
      monthlyFinanceTrend,
      libraryStatus: [
        { name: 'Available', value: availableBookCopies, color: '#10b981' },
        { name: 'Borrowed', value: borrowedBookCopies, color: '#3b82f6' },
        { name: 'Overdue', value: overdueBookIssues, color: '#f43f5e' },
      ],
      attendanceSummary: [
        { name: 'Present', value: presentCount, color: '#10b981' },
        { name: 'Absent', value: absentCount, color: '#f43f5e' },
        { name: 'Late', value: lateCount, color: '#f59e0b' },
        { name: 'Half Day', value: halfDayCount, color: '#8b5cf6' },
      ],
    },
    recent: {
      exams: recentExams.map((e: any) => ({
        _id: e._id,
        name: e.name,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        classes: (e.classes || []).map((c: any) => c.name || 'Class'),
      })),
      results: formattedResults,
      bookIssues: recentBookIssues.map((bi: any) => ({
        _id: bi._id,
        issueId: bi.issueId,
        bookTitle: bi.bookId?.title || 'Unknown Book',
        borrowerName: bi.borrowerId?.name || 'Unknown Borrower',
        borrowerRole: bi.borrowerId?.role || 'user',
        issueDate: bi.issueDate,
        dueDate: bi.dueDate,
        status: bi.status,
      })),
      invoices: recentInvoices.map((inv: any) => ({
        _id: inv._id,
        receiptNumber: inv.receiptNumber,
        studentName: inv.studentId?.studentName || 'Student',
        admissionNumber: inv.studentId?.admissionNumber || '',
        className: inv.classId?.name || '',
        paidAmount: inv.paidAmount,
        paymentMethod: inv.paymentMethod,
        paymentDate: inv.paymentDate,
        status: inv.status,
      })),
      announcements: recentAnnouncements.map((a: any) => ({
        _id: a._id,
        title: a.title,
        content: a.content,
        audience: a.audience,
        createdAt: a.createdAt,
      })),
      events: upcomingEvents.map((ev: any) => ({
        _id: ev._id,
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate,
        category: ev.category,
        isHoliday: ev.isHoliday,
      })),
    },
  };
};
