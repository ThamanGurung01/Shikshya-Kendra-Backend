import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { School } from "../models/school.model";
import { AcademicYear } from "../models/academic-year.model";
import { ClassModel as Class } from "../models/class.model";
import { SectionModel as Section } from "../models/section.model";
import { Student } from "../models/student.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { Parent } from "../models/parent.model";
import { User } from "../models/user.model";
import { Accountant } from "../models/accountant.model";
import { Teacher } from "../models/teacher.model";
import { Librarian } from "../models/librarian.model";
import { Admin } from "../models/admin.model";

import { FeeHead, IFeeHead } from "../models/fee-head.model";
import { FeeStructure } from "../models/fee-structure.model";
import { StudentFeeConfig } from "../models/student-fee-config.model";
import { FeeInvoice } from "../models/fee-invoice.model";
import { Income } from "../models/income.model";
import { Expense } from "../models/expense.model";
import { Payroll } from "../models/payroll.model";
import { StaffSalaryConfig } from "../models/staff-salary-config.model";

import { hashPassword } from "../utils/hash.util";
import { DEFAULT_PASSWORD } from "./allSeed.seeder";

const NEPALI_MONTHS = [
  { index: 1, name: "Baishakh", gregMonth: 3, gregDay: 15 }, // Mid April
  { index: 2, name: "Jestha", gregMonth: 4, gregDay: 15 },   // Mid May
  { index: 3, name: "Ashadh", gregMonth: 5, gregDay: 15 },   // Mid June
  { index: 4, name: "Shrawan", gregMonth: 6, gregDay: 16 },  // Mid July
  { index: 5, name: "Bhadra", gregMonth: 7, gregDay: 17 },   // Mid August
  { index: 6, name: "Ashwin", gregMonth: 8, gregDay: 17 },   // Mid September
  { index: 7, name: "Kartik", gregMonth: 9, gregDay: 18 },   // Mid October
  { index: 8, name: "Mangsir", gregMonth: 10, gregDay: 17 }, // Mid November
  { index: 9, name: "Poush", gregMonth: 11, gregDay: 16 },   // Mid December
  { index: 10, name: "Magh", gregMonth: 0, gregDay: 15 },    // Mid January (next yr)
  { index: 11, name: "Falgun", gregMonth: 1, gregDay: 13 },  // Mid February
  { index: 12, name: "Chaitra", gregMonth: 2, gregDay: 15 }, // Mid March
];

const seedAccount = async () => {
  try {
    console.log("=========================================");
    console.log("Starting Account Section Seeding...");
    console.log("=========================================");

    // Ensure all referenced Mongoose models are evaluated and registered
    const _models = [
      School.modelName,
      AcademicYear.modelName,
      Class.modelName,
      Section.modelName,
      Student.modelName,
      Parent.modelName,
      User.modelName,
      Accountant.modelName,
      Teacher.modelName,
      Librarian.modelName,
      Admin.modelName,
      FeeHead.modelName,
      FeeStructure.modelName,
      StudentFeeConfig.modelName,
      FeeInvoice.modelName,
      Income.modelName,
      Expense.modelName,
      Payroll.modelName,
      StaffSalaryConfig.modelName,
    ];
    void _models;

    // 1. Resolve Target School
    let school = await School.findOne({ school_email: "info@shikshyakendra.edu.np" });
    if (!school) {
      school = await School.findOne();
    }
    if (!school) {
      console.error("No school found in database! Please run school.seeder.ts first.");
      process.exit(1);
    }
    const schoolId = school._id as Types.ObjectId;
    console.log(`Target School: ${school.school_name} (${schoolId})`);

    // 2. Resolve Academic Year
    let academicYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
    if (!academicYear) {
      academicYear = await AcademicYear.findOne({ schoolId });
    }
    if (!academicYear) {
      academicYear = await new AcademicYear({
        schoolId,
        name: "2082/83",
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        isCurrent: true,
      }).save();
      console.log(`Created fallback Academic Year: ${academicYear.name}`);
    } else {
      console.log(`Active Academic Year: ${academicYear.name} (${academicYear._id})`);
    }

    // 3. Ensure Accountant User & Profile
    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
    let accountantUser = await User.findOne({ email: "accountant@shikshyakendra.edu.np" });
    if (!accountantUser) {
      accountantUser = await new User({
        name: "Hari Bansha",
        email: "accountant@shikshyakendra.edu.np",
        password: hashedPassword,
        role: "accountant",
        is_active: true,
      }).save();
      console.log("Created Accountant user: accountant@shikshyakendra.edu.np");
    }

    let accountantProfile = await Accountant.findOne({ schoolId, userId: accountantUser._id });
    if (!accountantProfile) {
      accountantProfile = await new Accountant({
        employeeId: "ACC001",
        accountantName: "Hari Bansha",
        address: "Lazimpat, Kathmandu",
        gender: "Male",
        contact: "9851044444",
        dob: new Date("1982-05-25"),
        accountant_email: "accountant@shikshyakendra.edu.np",
        schoolId,
        userId: accountantUser._id,
        status: "active",
        qualification: "MBA in Finance",
        joinDate: new Date("2020-01-01"),
      }).save();
      console.log("Created Accountant profile (Hari Bansha)");
    }

    // 4. Purge existing Account Section collections for clean idempotent seed
    console.log("\nPurging existing account section records...");
    await FeeHead.deleteMany({});
    await FeeStructure.deleteMany({});
    await StudentFeeConfig.deleteMany({});
    await FeeInvoice.deleteMany({});
    await Income.deleteMany({});
    await Expense.deleteMany({});
    await StaffSalaryConfig.deleteMany({});
    await Payroll.deleteMany({});
    console.log("Account collections purged successfully.");

    // 5. Fetch Classes and Enrollments
    const classes = await Class.find({ schoolId }).sort({ name: 1 });
    if (classes.length === 0) {
      console.error("No classes found for this school! Please run school.seeder.ts first.");
      process.exit(1);
    }
    console.log(`Found ${classes.length} classes.`);

    // 6. Seed Fee Heads
    console.log("\n1. Seeding Fee Heads...");
    const feeHeadsData = [
      // Monthly fee heads
      {
        title: "Smart Class & Digital Learning Fee",
        feeType: "monthly" as const,
        defaultAmount: 300,
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "Library & Reading Room Fee",
        feeType: "monthly" as const,
        defaultAmount: 200,
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "Computer Lab & Internet Fee",
        feeType: "monthly" as const,
        defaultAmount: 500,
        // Applicable for Class 4 to Class 10
        applicableClassIds: classes
          .filter((c) => {
            const num = parseInt(c.name.replace(/\D/g, ""), 10);
            return !isNaN(num) && num >= 4;
          })
          .map((c) => c._id),
      },
      // One-time fee heads (Month 1 - Baishakh)
      {
        title: "Annual Admission & Registration Fee",
        feeType: "one_time" as const,
        defaultAmount: 2500,
        applicableMonth: 1,
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "Student Identity Card Fee",
        feeType: "one_time" as const,
        defaultAmount: 250,
        applicableMonth: 1,
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "School Diary & Academic Calendar Fee",
        feeType: "one_time" as const,
        defaultAmount: 350,
        applicableMonth: 1,
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "Annual Magazine & Publication Fee",
        feeType: "one_time" as const,
        defaultAmount: 400,
        applicableMonth: 1,
        applicableClassIds: classes.map((c) => c._id),
      },
      // Term-wise exam fee heads
      {
        title: "First Terminal Examination Fee",
        feeType: "term_wise" as const,
        defaultAmount: 600,
        applicableMonth: 3, // Ashadh
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "Mid-Term Examination Fee",
        feeType: "term_wise" as const,
        defaultAmount: 800,
        applicableMonth: 6, // Ashwin
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "Second Terminal Examination Fee",
        feeType: "term_wise" as const,
        defaultAmount: 600,
        applicableMonth: 9, // Poush
        applicableClassIds: classes.map((c) => c._id),
      },
      {
        title: "Annual Final Examination Fee",
        feeType: "term_wise" as const,
        defaultAmount: 1000,
        applicableMonth: 12, // Chaitra
        applicableClassIds: classes.map((c) => c._id),
      },
    ];

    const seededFeeHeads: any[] = [];
    for (const fh of feeHeadsData) {
      const created = await new FeeHead({
        schoolId,
        title: fh.title,
        feeType: fh.feeType,
        defaultAmount: fh.defaultAmount,
        applicableMonth: fh.applicableMonth,
        applicableClassIds: fh.applicableClassIds,
      }).save();
      seededFeeHeads.push(created);
    }
    console.log(`Created ${seededFeeHeads.length} Fee Heads.`);

    // 7. Seed Class Fee Structures (Class 1 to 10)
    console.log("\n2. Seeding Class Monthly Fee Structures...");
    const classBaseFees: Record<number, number> = {
      1: 8500,
      2: 8800,
      3: 9200,
      4: 9800,
      5: 10500,
      6: 11500,
      7: 12500,
      8: 13500,
      9: 14500,
      10: 15500,
    };

    const feeStructures: any[] = [];
    for (const cls of classes) {
      const classNum = parseInt(cls.name.replace(/\D/g, ""), 10) || 1;
      const monthlyFee = classBaseFees[classNum] || (3000 + classNum * 400);

      const feeStructure = await new FeeStructure({
        schoolId,
        academicYearId: academicYear._id,
        classId: cls._id,
        monthlyFee,
        createdById: accountantUser._id,
        status: "active",
        deletedAt: null,
      }).save();
      feeStructures.push(feeStructure);
    }
    console.log(`Created ${feeStructures.length} Fee Structures for all classes.`);

    // 8. Seed Student Fee Configurations (Scholarships & Transport)
    console.log("\n3. Seeding Student Fee Configurations...");
    const enrollments = await StudentEnrollment.find({
      schoolId,
      academicYearId: academicYear._id,
      studentEnrollmentStatus: "active",
    })
      .populate("studentId")
      .populate("classId")
      .populate("sectionId");

    console.log(`Found ${enrollments.length} active enrollments to configure.`);

    const transportRoutes = [
      { route: "Budhanilkantha - Golfutar - School", fee: 2200 },
      { route: "Maharajgunj - Baluwatar - School", fee: 1600 },
      { route: "Gongabu - Samakhusi - Lazimpat", fee: 2000 },
      { route: "Thamel - Sorhakhutte - Lazimpat", fee: 1400 },
      { route: "Dhapasi - Basundhara - School", fee: 1800 },
    ];

    const studentConfigs: any[] = [];
    for (let i = 0; i < enrollments.length; i++) {
      const enr = enrollments[i];
      if (!enr) continue;
      const studentId = (enr.studentId as any)._id;

      // 35% of students use school bus transport
      const hasTransport = i % 3 === 0;
      const route = transportRoutes[i % transportRoutes.length];
      const transportFee = hasTransport && route ? route.fee : 0;

      // Assign discounts/scholarships across students
      let discountType: "none" | "percentage" | "flat" = "none";
      let discountValue = 0;
      let discountReason = "";

      if (i % 10 === 0) {
        // Merit / Academic Scholarship (20%)
        discountType = "percentage";
        discountValue = 20;
        discountReason = "Merit-Based Academic Scholarship (Top Ranker)";
      } else if (i % 10 === 1) {
        // Sibling Discount (15%)
        discountType = "percentage";
        discountValue = 15;
        discountReason = "Sibling Concession Scheme";
      } else if (i % 20 === 5) {
        // Financial Assistance (Flat Rs. 1000)
        discountType = "flat";
        discountValue = 1000;
        discountReason = "Need-Based Underprivileged Assistance";
      } else if (i % 20 === 15) {
        // Staff Child Concession (50%)
        discountType = "percentage";
        discountValue = 50;
        discountReason = "Staff Ward Concession";
      }

      const config = await new StudentFeeConfig({
        schoolId,
        studentId,
        customMonthlyFee: null, // default to class monthly fee
        discountType,
        discountValue,
        discountReason,
        hasTransport,
        transportFee,
        status: "active",
      }).save();

      studentConfigs.push(config);
    }
    console.log(`Created ${studentConfigs.length} Student Fee Configurations.`);

    // 9. Seed Fee Invoices & Linked Incomes & Payment Transactions
    console.log("\n4. Seeding Fee Invoices, Collections & Payment Records...");
    let receiptSeq = 1;
    let incomeSeq = 1;
    const currentYear = new Date().getFullYear();

    const paymentMethodOptions: Array<"cash" | "esewa" | "bank_transfer" | "cheque"> = [
      "cash",
      "esewa",
      "bank_transfer",
      "cash",
      "esewa",
      "cash",
      "cheque",
    ];

    let totalInvoicesCreated = 0;
    let totalCollectedAmount = 0;

    // Pre-map class fees
    const classFeeMap = new Map<string, number>();
    feeStructures.forEach((fs) => classFeeMap.set(fs.classId.toString(), fs.monthlyFee));

    // Pre-map student configs
    const studentConfigMap = new Map<string, any>();
    studentConfigs.forEach((sc) => studentConfigMap.set(sc.studentId.toString(), sc));

    // Process each student enrollment
    // We will distribute students into:
    // - Paid up to Month 5 (Bhadra): 50%
    // - Advance paid up to Month 6 or 7: 15%
    // - Partially paid (e.g. Month 1 & 2): 20%
    // - Unpaid / pending dues: 15%
    for (let i = 0; i < enrollments.length; i++) {
      const enr = enrollments[i];
      if (!enr) continue;
      const student = enr.studentId as any;
      const studentId = student._id;
      const classId = (enr.classId as any)._id;
      const sectionId = (enr.sectionId as any)?._id;
      const baseClassFee = classFeeMap.get(classId.toString()) || 3500;
      const cfg = studentConfigMap.get(studentId.toString());

      let monthsToPay: number[] = [];
      const distribution = i % 10;

      if (distribution >= 0 && distribution <= 4) {
        // 50%: Paid months 1, 2, 3, 4, 5 (Current full payers)
        monthsToPay = [1, 2, 3, 4, 5];
      } else if (distribution === 5 || distribution === 6) {
        // 20%: Advance payers (Months 1 to 6 or 7)
        monthsToPay = distribution === 5 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7];
      } else if (distribution === 7 || distribution === 8) {
        // 20%: Paid only early months (1 & 2)
        monthsToPay = [1, 2];
      } else {
        // 10%: Defaulters (unpaid) - No invoice, so pending balance shows on dashboard!
        continue;
      }

      // Group payments into 1 or 2 invoices (e.g. Invoice 1 for Month 1-2, Invoice 2 for Month 3-5)
      const batches: number[][] = [];
      if (monthsToPay.length <= 2) {
        batches.push(monthsToPay);
      } else if (monthsToPay.length <= 4) {
        batches.push(monthsToPay.slice(0, 2));
        batches.push(monthsToPay.slice(2));
      } else {
        batches.push(monthsToPay.slice(0, 3));
        batches.push(monthsToPay.slice(3));
      }

      for (const batchMonths of batches) {
        const items: Array<{
          title: string;
          month?: number;
          feeHeadId?: Types.ObjectId;
          amount: number;
        }> = [];

        let subTotal = 0;

        for (const mIndex of batchMonths) {
          const nepMonth = NEPALI_MONTHS[mIndex - 1];
          if (!nepMonth) continue;

          // 1. Monthly Tuition Fee
          items.push({
            title: `Monthly Tuition Fee - ${nepMonth.name}`,
            month: mIndex,
            amount: baseClassFee,
          });
          subTotal += baseClassFee;

          // 2. Transport Fee (if configured)
          if (cfg?.hasTransport && cfg.transportFee > 0) {
            items.push({
              title: `Bus Transport Service - ${nepMonth.name}`,
              month: mIndex,
              amount: cfg.transportFee,
            });
            subTotal += cfg.transportFee;
          }

          // 3. Applicable Fee Heads for this month
          for (const fh of seededFeeHeads) {
            let applies = false;
            // Check class applicability
            if (
              !fh.applicableClassIds ||
              fh.applicableClassIds.length === 0 ||
              fh.applicableClassIds.some((c: any) => c.toString() === classId.toString())
            ) {
              if (fh.feeType === "monthly") {
                applies = true;
              } else if (fh.applicableMonth === mIndex) {
                applies = true;
              }
            }

            if (applies) {
              items.push({
                title: `${fh.title} (${nepMonth.name})`,
                month: mIndex,
                feeHeadId: fh._id,
                amount: fh.defaultAmount,
              });
              subTotal += fh.defaultAmount;
            }
          }
        }

        // Calculate discount
        let discountAmount = 0;
        if (cfg?.discountType === "percentage" && cfg.discountValue > 0) {
          discountAmount = Math.round((baseClassFee * batchMonths.length * cfg.discountValue) / 100);
        } else if (cfg?.discountType === "flat" && cfg.discountValue > 0) {
          discountAmount = Math.min(subTotal, cfg.discountValue * batchMonths.length);
        }

        const totalAmount = Math.max(0, subTotal - discountAmount);
        const paidAmount = totalAmount; // fully paid for this invoice
        const dueAmount = 0;

        const firstMonth = batchMonths[0] ?? 1;
        const pm = paymentMethodOptions[(i + firstMonth) % paymentMethodOptions.length] || "cash";
        const receiptNumber = `REC-${currentYear}${String(firstMonth).padStart(2, "0")}-${String(receiptSeq++).padStart(5, "0")}`;
        const voucherNumber = `INC-${currentYear}-${String(incomeSeq++).padStart(4, "0")}`;

        // Construct realistic payment date corresponding to the billed month
        const firstMonthInfo = NEPALI_MONTHS[firstMonth - 1];
        const paymentDate = new Date(
          currentYear,
          firstMonthInfo?.gregMonth ?? 3,
          (firstMonthInfo?.gregDay ?? 15) + (i % 10)
        );

        let paymentReference = "Counter Cash Receipt";
        if (pm === "esewa") paymentReference = `ESEWA-${Date.now().toString().slice(-6)}-${receiptSeq}`;
        else if (pm === "bank_transfer") paymentReference = `NABIL-TXN-${100000 + receiptSeq}`;
        else if (pm === "cheque") paymentReference = `CHQ-${400000 + receiptSeq}`;

        // Create FeeInvoice
        const invoice = await new FeeInvoice({
          receiptNumber,
          schoolId,
          academicYearId: academicYear._id,
          studentId,
          classId,
          sectionId,
          paidMonths: batchMonths,
          items,
          subTotal,
          discountAmount,
          proRatioWaiver: 0,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentMethod: pm,
          paymentReference,
          paymentDate,
          status: "paid",
          remarks: `Fee settlement for ${batchMonths.map((m) => NEPALI_MONTHS[m - 1]?.name || `Month ${m}`).join(", ")}`,
          collectedBy: accountantUser._id,
          deletedAt: null,
        }).save();

        // Create linked Income record
        const monthNamesStr = batchMonths.map((m) => NEPALI_MONTHS[m - 1]?.name || `Month ${m}`).join(", ");
        const income = await new Income({
          voucherNumber,
          schoolId,
          category: "Student Fee",
          title: `Fee Collection: ${student.studentName} (${monthNamesStr})`,
          amount: totalAmount,
          discountAmount: 0,
          netAmount: paidAmount,
          paymentMethod: pm,
          date: paymentDate,
          description: `Receipt: ${receiptNumber} | Adm: ${student.admissionNumber} | Class: ${(enr.classId as any)?.name || "Class"}`,
          invoiceId: invoice._id,
          createdById: accountantUser._id,
          deletedAt: null,
        }).save();

        // Update invoice incomeId
        invoice.incomeId = income._id as any;
        await invoice.save();

        totalInvoicesCreated++;
        totalCollectedAmount += paidAmount;
      }
    }
    console.log(
      `Created ${totalInvoicesCreated} Fee Invoices & linked Income records (Total Collected: NRs. ${totalCollectedAmount.toLocaleString()}).`
    );

    // 10. Seed Institutional Incomes (Grants, Canteen, Donations, Miscellaneous)
    console.log("\n5. Seeding Institutional Incomes & Live Daybook Register...");
    const institutionalIncomes = [
      {
        title: "Ministry of Education ICT Infrastructure Grant",
        category: "Grant",
        amount: 250000,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 3, 20), // Baishakh
        description: "Annual government conditional grant for smart classroom expansion",
      },
      {
        title: "School Canteen Lease Rent - Baishakh",
        category: "Canteen Rent",
        amount: 30000,
        paymentMethod: "cheque" as const,
        date: new Date(currentYear, 3, 25),
        description: "Monthly canteen concession fee - Lazimpat Caterers",
      },
      {
        title: "School Canteen Lease Rent - Jestha",
        category: "Canteen Rent",
        amount: 30000,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 4, 25),
        description: "Monthly canteen concession fee - Lazimpat Caterers",
      },
      {
        title: "School Canteen Lease Rent - Ashadh",
        category: "Canteen Rent",
        amount: 30000,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 5, 25),
        description: "Monthly canteen concession fee - Lazimpat Caterers",
      },
      {
        title: "School Canteen Lease Rent - Shrawan",
        category: "Canteen Rent",
        amount: 30000,
        paymentMethod: "cheque" as const,
        date: new Date(currentYear, 6, 25),
        description: "Monthly canteen concession fee - Lazimpat Caterers",
      },
      {
        title: "School Canteen Lease Rent - Bhadra",
        category: "Canteen Rent",
        amount: 30000,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 7, 20),
        description: "Monthly canteen concession fee - Lazimpat Caterers",
      },
      {
        title: "Alumni Association Science Lab Endowment",
        category: "Donation",
        amount: 100000,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 4, 10),
        description: "Donation from 2075 SLC/SEE Alumni batch for robotics equipment",
      },
      {
        title: "Auditorium Hall Booking - Community Rotary Event",
        category: "Miscellaneous",
        amount: 25000,
        paymentMethod: "cash" as const,
        date: new Date(currentYear, 5, 12),
        description: "Weekend hall reservation charges for charity symposium",
      },
      {
        title: "Sale of Old Newspapers, Damaged Furniture & Scrap",
        category: "Miscellaneous",
        amount: 14500,
        paymentMethod: "cash" as const,
        date: new Date(currentYear, 6, 8),
        description: "Auction of annual obsolete office scrap and paper bales",
      },
      {
        title: "Uniform & Stationery Supplier Counter Commission",
        category: "Miscellaneous",
        amount: 35000,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 3, 28),
        description: "Authorized vendor seasonal concession fee",
      },
      // Today's Daybook Live Incomes (Testing Daybook register)
      {
        title: "Late Fee Fine Counter Collection",
        category: "Miscellaneous",
        amount: 3500,
        paymentMethod: "cash" as const,
        date: new Date(),
        description: "Overdue library and late admission documentation clearance",
      },
      {
        title: "Academic Transcript & Certificate Verification Fees",
        category: "Miscellaneous",
        amount: 2500,
        paymentMethod: "cash" as const,
        date: new Date(),
        description: "Alumni transcript issue service fee (5 students)",
      },
    ];

    for (const inc of institutionalIncomes) {
      const voucherNumber = `INC-${currentYear}-${String(incomeSeq++).padStart(4, "0")}`;
      await new Income({
        voucherNumber,
        schoolId,
        category: inc.category,
        title: inc.title,
        amount: inc.amount,
        discountAmount: 0,
        netAmount: inc.amount,
        paymentMethod: inc.paymentMethod,
        date: inc.date,
        description: inc.description,
        createdById: accountantUser._id,
        deletedAt: null,
      }).save();
    }
    console.log(`Created ${institutionalIncomes.length} institutional incomes.`);

    // 11. Seed Staff Salary Configurations
    console.log("\n6. Seeding Staff Salary Configurations...");
    const teachers = await Teacher.find({ schoolId }).populate("userId");
    const librarian = await Librarian.findOne({ schoolId }).populate("userId");
    const admins = await Admin.find({ schoolId }).populate("userId");

    const salaryConfigs: any[] = [];

    // Configure Accountant Salary
    salaryConfigs.push(
      await new StaffSalaryConfig({
        schoolId,
        userId: accountantUser._id,
        staffRole: "accountant",
        staffRefId: accountantProfile._id,
        basicSalary: 38000,
        allowances: [
          { title: "Dearness Allowance", amount: 4000 },
          { title: "Professional Allowance", amount: 3000 },
          { title: "Conveyance Allowance", amount: 2000 },
        ],
        deductions: [
          { title: "Provident Fund (10%)", amount: 3800 },
          { title: "Social Security Tax", amount: 500 },
        ],
        status: "active",
      }).save()
    );

    // Configure Librarian Salary
    if (librarian && librarian.userId) {
      salaryConfigs.push(
        await new StaffSalaryConfig({
          schoolId,
          userId: (librarian.userId as any)._id,
          staffRole: "librarian",
          staffRefId: librarian._id,
          basicSalary: 32000,
          allowances: [
            { title: "Dearness Allowance", amount: 3500 },
            { title: "Book & Reading Allowance", amount: 1500 },
          ],
          deductions: [
            { title: "Provident Fund (10%)", amount: 3200 },
            { title: "Social Security Tax", amount: 400 },
          ],
          status: "active",
        }).save()
      );
    }

    // Configure Admins Salary
    for (const adm of admins) {
      if (!adm.userId) continue;
      const isAdminHead = adm.employeeId === "ADM001";
      salaryConfigs.push(
        await new StaffSalaryConfig({
          schoolId,
          userId: (adm.userId as any)._id,
          staffRole: "admin",
          staffRefId: adm._id,
          basicSalary: isAdminHead ? 52000 : 45000,
          allowances: [
            { title: "Administrative Responsibility Allowance", amount: isAdminHead ? 8000 : 5000 },
            { title: "Dearness Allowance", amount: 4500 },
          ],
          deductions: [
            { title: "Provident Fund (10%)", amount: isAdminHead ? 5200 : 4500 },
            { title: "Income & Social Security Tax", amount: 1200 },
          ],
          status: "active",
        }).save()
      );
    }

    // Configure Teachers Salary
    for (let tIdx = 0; tIdx < teachers.length; tIdx++) {
      const tch = teachers[tIdx];
      if (!tch || !tch.userId) continue;

      const baseTeacherSalary = 32000 + (tIdx % 5) * 2500; // Rs. 32,000 to 42,000
      salaryConfigs.push(
        await new StaffSalaryConfig({
          schoolId,
          userId: (tch.userId as any)._id,
          staffRole: "teacher",
          staffRefId: tch._id,
          basicSalary: baseTeacherSalary,
          allowances: [
            { title: "Dearness Allowance", amount: 3500 },
            { title: "Performance Teaching Allowance", amount: 2000 },
            { title: "Communication Allowance", amount: 1000 },
          ],
          deductions: [
            { title: "Provident Fund (10%)", amount: Math.round(baseTeacherSalary * 0.1) },
            { title: "Social Security Tax", amount: 400 },
          ],
          status: "active",
        }).save()
      );
    }
    console.log(`Configured salary structures for ${salaryConfigs.length} staff members.`);

    // 12. Seed Monthly Payroll Runs & Salary Expenses
    console.log("\n7. Seeding Monthly Payrolls & Disbursed Salary Expenses...");
    let expenseSeq = 1;
    let payrollCounter = 1;

    // We will generate payroll for Months 1 (Baishakh), 2 (Jestha), 3 (Ashadh), 4 (Shrawan), 5 (Bhadra)
    // - Months 1 to 3: Fully paid / disbursed (Creates linked Salary Expenses)
    // - Month 4: Mostly paid, 2 unpaid
    // - Month 5: All unpaid (ready for the user to test the "Disburse Salary" button in UI!)
    const payrollMonths = [1, 2, 3, 4, 5];

    let totalPayrollsSeeded = 0;
    let totalSalariesDisbursed = 0;

    for (const mIndex of payrollMonths) {
      const nepMonth = NEPALI_MONTHS[mIndex - 1];
      if (!nepMonth) continue;
      const isUnpaidBatch = mIndex === 5; // Month 5 (Bhadra) remains pending for testing
      const isPartialBatch = mIndex === 4;

      for (let sIdx = 0; sIdx < salaryConfigs.length; sIdx++) {
        const cfg = salaryConfigs[sIdx];
        if (!cfg) continue;
        const totalAllowance = (cfg.allowances || []).reduce((acc: number, a: any) => acc + a.amount, 0);
        const totalDeduction = (cfg.deductions || []).reduce((acc: number, d: any) => acc + d.amount, 0);
        const netSalary = Math.max(0, cfg.basicSalary + totalAllowance - totalDeduction);

        const payrollNumber = `PAY-${currentYear}${String(mIndex).padStart(2, "0")}-${String(payrollCounter++).padStart(3, "0")}`;

        let isPaid = true;
        if (isUnpaidBatch) {
          isPaid = false;
        } else if (isPartialBatch && sIdx < 2) {
          isPaid = false; // leave first two unpaid in month 4
        }

        const paymentMethod: "bank_transfer" | "cheque" | "cash" =
          sIdx % 3 === 0 ? "bank_transfer" : sIdx % 3 === 1 ? "cheque" : "cash";

        const paymentDate = new Date(currentYear, nepMonth.gregMonth, nepMonth.gregDay + 10);

        const payroll = await new Payroll({
          payrollNumber,
          schoolId,
          userId: cfg.userId,
          staffRole: cfg.staffRole,
          month: mIndex,
          year: currentYear,
          basicSalary: cfg.basicSalary,
          totalAllowance,
          totalDeduction,
          netSalary,
          paymentStatus: isPaid ? "paid" : "unpaid",
          paymentMethod: isPaid ? paymentMethod : undefined,
          paymentDate: isPaid ? paymentDate : undefined,
          transactionReference: isPaid ? `SAL-TXN-${10000 + payrollCounter}` : undefined,
          generatedBy: accountantUser._id,
          deletedAt: null,
        }).save();

        if (isPaid) {
          // Create linked Salary Expense
          const voucherNumber = `EXP-${currentYear}-${String(expenseSeq++).padStart(4, "0")}`;
          const expense = await new Expense({
            voucherNumber,
            schoolId,
            category: "Salary",
            title: `Salary Disbursement: Month ${nepMonth.name} (${cfg.staffRole.toUpperCase()})`,
            amount: netSalary,
            discountAmount: 0,
            netAmount: netSalary,
            paymentMethod,
            date: paymentDate,
            description: `Payroll #${payrollNumber} | Role: ${cfg.staffRole} | Ref: SAL-TXN-${10000 + payrollCounter}`,
            payrollId: payroll._id,
            createdById: accountantUser._id,
            deletedAt: null,
          }).save();

          payroll.expenseId = expense._id as any;
          await payroll.save();

          totalSalariesDisbursed += netSalary;
        }

        totalPayrollsSeeded++;
      }
    }
    console.log(
      `Created ${totalPayrollsSeeded} Payroll slips across 5 months (Total Disbursed: NRs. ${totalSalariesDisbursed.toLocaleString()}).`
    );

    // 13. Seed General Operating Expenses
    console.log("\n8. Seeding Operational Expenses & Live Daybook Register...");
    const generalExpenses = [
      // Baishakh (Month 1)
      {
        title: "Nepal Electricity Authority (NEA) Lazimpat - Baishakh",
        category: "Electricity",
        amount: 18400,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 3, 22),
        description: "Lazimpat distribution center meter account #412.01",
      },
      {
        title: "Drinking Water Tanker Refill & Purifier Filter Maintenance",
        category: "Water",
        amount: 12500,
        paymentMethod: "cash" as const,
        date: new Date(currentYear, 3, 26),
        description: "Five 5,000L water tankers and RO membrane servicing",
      },
      {
        title: "Subisu Optical Fiber Dedicated High-Speed Internet",
        category: "Internet",
        amount: 6500,
        paymentMethod: "online" as const,
        date: new Date(currentYear, 3, 28),
        description: "100 Mbps fiber optic enterprise connection for labs & admin",
      },
      // Jestha (Month 2)
      {
        title: "Nepal Electricity Authority (NEA) Lazimpat - Jestha",
        category: "Electricity",
        amount: 19800,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 4, 22),
        description: "Monthly electricity bill",
      },
      {
        title: "Classroom Desks, Benches & Whiteboard Repairs",
        category: "Maintenance",
        amount: 32000,
        paymentMethod: "cheque" as const,
        date: new Date(currentYear, 4, 15),
        description: "Carpentry repair and surface coating for Blocks A and B",
      },
      {
        title: "Bulk Purchase of Whiteboard Markers, Registers & Exam Papers",
        category: "Supplies",
        amount: 24500,
        paymentMethod: "cash" as const,
        date: new Date(currentYear, 4, 18),
        description: "Stationery refill for all faculty desks and examinations",
      },
      // Ashadh (Month 3)
      {
        title: "Nepal Electricity Authority (NEA) Lazimpat - Ashadh",
        category: "Electricity",
        amount: 22100,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 5, 22),
        description: "Monthly electricity bill",
      },
      {
        title: "Science Laboratory Chemical Reagents & Glassware Refill",
        category: "Supplies",
        amount: 28000,
        paymentMethod: "cheque" as const,
        date: new Date(currentYear, 5, 14),
        description: "Chemistry and biology lab specimens from Scientific Supplies Nepal",
      },
      {
        title: "School Generator Fuel (Diesel 120 Litres) & Filter Replacement",
        category: "Maintenance",
        amount: 21500,
        paymentMethod: "cash" as const,
        date: new Date(currentYear, 5, 19),
        description: "Emergency standby generator servicing and fuel procurement",
      },
      // Shrawan (Month 4)
      {
        title: "Nepal Electricity Authority (NEA) Lazimpat - Shrawan",
        category: "Electricity",
        amount: 20400,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 6, 22),
        description: "Monthly electricity bill",
      },
      {
        title: "Annual Sports Meet Football Ground Reservation",
        category: "Event",
        amount: 45000,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 6, 12),
        description: "Ground rental and lighting fees for inter-house sports meet",
      },
      {
        title: "Sports Trophies, Medals & Participation Certificates",
        category: "Event",
        amount: 22000,
        paymentMethod: "cheque" as const,
        date: new Date(currentYear, 6, 16),
        description: "Custom engraved shields and medals from Trophy House Kathmandu",
      },
      // Bhadra (Month 5)
      {
        title: "Nepal Electricity Authority (NEA) Lazimpat - Bhadra",
        category: "Electricity",
        amount: 19200,
        paymentMethod: "bank_transfer" as const,
        date: new Date(currentYear, 7, 21),
        description: "Monthly electricity bill",
      },
      {
        title: "Library Encyclopedia, Reference Books & Periodicals Subscription",
        category: "Supplies",
        amount: 34000,
        paymentMethod: "cheque" as const,
        date: new Date(currentYear, 7, 10),
        description: "New arrivals for secondary student research corner",
      },
      {
        title: "Municipal Solid Waste Management & Sanitation Fee",
        category: "Miscellaneous",
        amount: 4800,
        paymentMethod: "cash" as const,
        date: new Date(currentYear, 7, 18),
        description: "Kathmandu Metropolitan Ward #3 sanitation charges",
      },
      // Live Daybook Expenses for Today
      {
        title: "Photocopy Paper Cartons (5 Reams) & Printer Toner Cartridge",
        category: "Supplies",
        amount: 4200,
        paymentMethod: "cash" as const,
        date: new Date(),
        description: "Emergency dispatch printing supplies for mid-term routines",
      },
      {
        title: "Courier & Registered Postage Stamps for Board Letters",
        category: "Miscellaneous",
        amount: 850,
        paymentMethod: "cash" as const,
        date: new Date(),
        description: "Urgent official correspondence to National Examination Board",
      },
    ];

    for (const exp of generalExpenses) {
      const voucherNumber = `EXP-${currentYear}-${String(expenseSeq++).padStart(4, "0")}`;
      await new Expense({
        voucherNumber,
        schoolId,
        category: exp.category,
        title: exp.title,
        amount: exp.amount,
        discountAmount: 0,
        netAmount: exp.amount,
        paymentMethod: exp.paymentMethod,
        date: exp.date,
        description: exp.description,
        createdById: accountantUser._id,
        deletedAt: null,
      }).save();
    }
    console.log(`Created ${generalExpenses.length} operating expenses.`);

    // 14. Seed 12-Month Historical Financial Data for Budget Prediction & Financial Forecast
    console.log("\n9. Seeding 12-Month Historical Financial Data for Financial Forecast & Budget Predictions...");
    let historicalIncomeCount = 0;
    let historicalExpenseCount = 0;

    for (let mOffset = 11; mOffset >= 1; mOffset--) {
      const pastDate = new Date();
      pastDate.setDate(15);
      pastDate.setMonth(pastDate.getMonth() - mOffset);
      pastDate.setHours(10, 0, 0, 0);

      const year = pastDate.getFullYear();
      const monthStr = pastDate.toLocaleString("en-US", { month: "short" });

      // Monthly Fee & Institutional Income (Gradual growth trajectory: NRs. 1.85M to 2.15M/mo)
      const monthlyIncomeAmount = 1850000 + (11 - mOffset) * 28000 + (mOffset % 3 === 0 ? 45000 : 0);
      const incVoucher = `INC-${year}-${String(incomeSeq++).padStart(4, "0")}`;

      await new Income({
        voucherNumber: incVoucher,
        schoolId,
        category: "Student Fee",
        title: `Consolidated Fee Collections & Institutional Revenue - ${monthStr} ${year}`,
        amount: monthlyIncomeAmount,
        discountAmount: 0,
        netAmount: monthlyIncomeAmount,
        paymentMethod: "bank_transfer",
        date: pastDate,
        description: `Monthly tuition, transport, and facility revenue for ${monthStr} ${year}`,
        createdById: accountantUser._id,
        deletedAt: null,
      }).save();
      historicalIncomeCount++;

      // Monthly Payroll & Facility Operational Expense (Controlled stable expenditure: NRs. 1.28M to 1.42M/mo)
      const monthlyExpenseAmount = 1280000 + (11 - mOffset) * 12000 + (mOffset % 4 === 0 ? 35000 : 0);
      const expVoucher = `EXP-${year}-${String(expenseSeq++).padStart(4, "0")}`;

      await new Expense({
        voucherNumber: expVoucher,
        schoolId,
        category: "Salary",
        title: `Consolidated Monthly Payroll & Operations Disbursed - ${monthStr} ${year}`,
        amount: monthlyExpenseAmount,
        discountAmount: 0,
        netAmount: monthlyExpenseAmount,
        paymentMethod: "bank_transfer",
        date: pastDate,
        description: `Staff salary disbursements & operational utility expenses for ${monthStr} ${year}`,
        createdById: accountantUser._id,
        deletedAt: null,
      }).save();
      historicalExpenseCount++;
    }
    console.log(`Seeded 12-month historical financial dataset (${historicalIncomeCount} income logs, ${historicalExpenseCount} expense logs).`);

    console.log("\n=========================================");
    console.log("Account Section Seeding Completed Successfully!");
    console.log("=========================================");
    console.log(`Summary:`);
    console.log(`- Fee Heads: ${seededFeeHeads.length}`);
    console.log(`- Fee Structures: ${feeStructures.length}`);
    console.log(`- Student Fee Configs: ${studentConfigs.length}`);
    console.log(`- Fee Invoices: ${totalInvoicesCreated}`);
    console.log(`- Total Incomes Seeded: ${await Income.countDocuments({ schoolId })}`);
    console.log(`- Total Expenses Seeded: ${await Expense.countDocuments({ schoolId })}`);
    console.log(`- Staff Salary Configs: ${salaryConfigs.length}`);
    console.log(`- Payrolls Seeded: ${totalPayrollsSeeded}`);
    console.log("=========================================\n");
  } catch (error) {
    console.error("Error during Account Section seeding:", error);
    throw error;
  }
};

export { seedAccount };

if (require.main === module) {
  const { connectDB, closeDB } = require("../configs/db");
  (async () => {
    await connectDB();
    await seedAccount();
    await closeDB();
  })();
}
