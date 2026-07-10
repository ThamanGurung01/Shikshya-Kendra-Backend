import "dotenv/config";
import { School } from "../models/school.model";
import { User } from "../models/user.model";
import { Teacher } from "../models/teacher.model";
import { SubjectModel as Subject } from "../models/subject.model";
import { SubjectTeacherMapping } from "../models/subject-teacher-mapping.model";
import { ClassTeacherAssignment } from "../models/class-teacher-assignment.model";

import { SchoolScheduleConfig } from "../models/school-schedule-config.model";
import { ClassModel as Class } from "../models/class.model";
import { SectionModel as Section } from "../models/section.model";
import { hashPassword } from "../utils/hash.util";
import { DEFAULT_PASSWORD } from "./allSeed.seeder";

const MAX_WEEKLY_LOAD_PER_TEACHER = 40;

const extractClassNumber = (className: string): number => {
  const match = className.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

const SUBJECT_PERIODS_PER_WEEK: Record<string, number> = {
  "English": 5,
  "Mathematics": 5,
  "Science": 5,
  "Social Studies": 5,
  "Nepali": 5,
  "Computer": 5,
  "General Knowledge": 5,
  "Health & Physical Education": 5,
  "Optional Mathematics": 5,
};

const seedTeachers = async () => {
  try {
    const school = await School.findOne({ school_email: "info@shikshyakendra.edu.np" });
    if (!school) {
      console.error("No school found. Please run school.ts seeder first.");
      process.exit(1);
    }
    const schoolId = school._id;
    console.log(`Using school: ${school.school_name} (${schoolId})`);

    let classes = await Class.find({ schoolId })
      .lean()
      .then((rows) => rows.sort((a: any, b: any) => extractClassNumber(a.name) - extractClassNumber(b.name)));

    const classByNumber = new Map<number, any>();
    for (const cls of classes) {
      const classNum = extractClassNumber(cls.name || "");
      if (Number.isFinite(classNum) && classNum >= 1 && classNum <= 10 && !classByNumber.has(classNum)) {
        classByNumber.set(classNum, cls);
      }
    }

    for (let classNum = 1; classNum <= 10; classNum += 1) {
      if (!classByNumber.has(classNum)) {
        const createdClass = await new Class({ schoolId, name: `Class ${classNum}` }).save();
        classByNumber.set(classNum, createdClass.toObject());
      }
    }

    classes = Array.from({ length: 10 }, (_, idx) => classByNumber.get(idx + 1)!);

    let sections = await Section.find({
      schoolId,
      classId: { $in: classes.map((item: any) => item._id) },
    }).lean();

    for (const cls of classes) {
      const classSections = sections.filter((item: any) => item.classId.toString() === cls._id.toString());
      const hasSectionA = classSections.some((item: any) => (item.name || "").toLowerCase() === "section a");
      const hasSectionB = classSections.some((item: any) => (item.name || "").toLowerCase() === "section b");

      if (!hasSectionA) {
        const secA = await new Section({ schoolId, classId: cls._id, name: "Section A" }).save();
        sections.push(secA.toObject());
      }

      if (!hasSectionB) {
        const secB = await new Section({ schoolId, classId: cls._id, name: "Section B" }).save();
        sections.push(secB.toObject());
      }
    }

    sections = sections.sort((a: any, b: any) => {
      const classOrder =
        classes.findIndex((item: any) => item._id.toString() === a.classId.toString()) -
        classes.findIndex((item: any) => item._id.toString() === b.classId.toString());
      if (classOrder !== 0) return classOrder;
      return (a.name || "").localeCompare(b.name || "");
    });

    console.log(`Using ${classes.length} canonical classes and ${sections.length} sections.`);

    console.log("Purging old teacher-related data...");
    await SubjectTeacherMapping.deleteMany({});
    await ClassTeacherAssignment.deleteMany({});

    await SchoolScheduleConfig.deleteMany({});
    await Subject.deleteMany({});
    await Teacher.deleteMany({});
    await User.deleteMany({ role: "teacher" });

    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    console.log("Creating 25 Teachers...");
    const teacherDocs: any[] = [];

    const teacherNames = [
      "Ram Chandra Sharma", "Sita Devi Poudel", "Krishna Prasad Acharya",
      "Radhika Thapa", "Bishnu Kumar Rai", "Gita Kumari Gurung",
      "Hari Bahadur KC", "Maya Devi Shrestha", "Prakash Rijal",
      "Sunita Sharma", "Dipak Kumar Basnet", "Anita Karki",
      "Rajendra Tamang", "Pabitra Bhattarai", "Sagar Neupane",
      "Bimala Acharya", "Sanjay Shrestha", "Usha Koirala",
      "Mohan Thapa", "Laxmi Poudel",
      "Kumari Thapa", "Devendra Sharma", "Sandhya Rana",
      "Pradeep Ghimire", "Asha Devi",
    ];

    const employeePrefix = "TCH";
    const genders = ["Male", "Female"];

    for (let i = 0; i < 25; i++) {
      const emailName = teacherNames[i]!.toLowerCase().replace(/\s+/g, ".");

      const tUser = await new User({
        name: teacherNames[i],
        email: `${emailName}@shikshyakendra.edu.np`,
        password: hashedPassword,
        role: "teacher",
        is_active: true,
      }).save();

      const teacherDoc = await new Teacher({
        employeeId: `${employeePrefix}${(i + 1).toString().padStart(3, "0")}`,
        teacherName: teacherNames[i],
        address: "Kathmandu",
        gender: genders[i % 2],
        contact: `984100${(i + 1).toString().padStart(4, "0")}`,
        dob: new Date(`198${i % 9 + 1}-0${(i % 9) + 1}-15`),
        teacher_email: `${emailName}@shikshyakendra.edu.np`,
        schoolId: schoolId,
        userId: tUser._id,
        status: "active",
        qualification: ["B.Ed.", "M.Ed.", "Ph.D."][i % 3],
        joinDate: new Date(`202${Math.min(i % 5, 4) + 1}-04-01`),
      }).save();
      teacherDocs.push(teacherDoc);
    }
    console.log(`${teacherDocs.length} teachers created.`);

    console.log("Creating Subjects per class...");
    const classSubjectsMap = new Map<string, any[]>();

    const subjectNamesClass1to6 = [
      "English", "Mathematics", "Science", "Social Studies",
      "Nepali", "Computer", "General Knowledge",
    ];

    const subjectNamesClass7to10 = [
      "English", "Mathematics", "Science", "Social Studies",
      "Nepali", "Computer", "Health & Physical Education",
      "Optional Mathematics",
    ];

    for (let cIdx = 0; cIdx < classes.length; cIdx++) {
      const cls = classes[cIdx]!;
      const classNum = extractClassNumber(cls.name);
      const isClass1to6 = classNum <= 6;
      const subNames = isClass1to6 ? subjectNamesClass1to6 : subjectNamesClass7to10;
      const createdSubjects: any[] = [];

      for (let sIdx = 0; sIdx < subNames.length; sIdx++) {
        const sName = subNames[sIdx]!;
        const sCode = `${sName.slice(0, 3).toUpperCase()}${classNum}${sIdx + 1}`;
        const subject = await new Subject({
          schoolId: schoolId,
          classId: cls._id,
          name: sName,
          code: sCode,
        }).save();
        createdSubjects.push(subject);
      }
      classSubjectsMap.set(cls._id.toString(), createdSubjects);
    }
    console.log("Subjects created for all classes.");

    const teacherLoads = new Map<string, number>();
    teacherDocs.forEach((teacherDoc) => teacherLoads.set(teacherDoc._id.toString(), 0));

    const teacherByIndexes = (indexes: number[]) => indexes.map((index) => teacherDocs[index]).filter(Boolean);
    const subjectTeacherPools = new Map<string, any[]>([
      ["English", teacherByIndexes([0, 1, 2, 20])],
      ["Mathematics", teacherByIndexes([3, 4, 5, 21])],
      ["Science", teacherByIndexes([6, 7, 8, 22])],
      ["Social Studies", teacherByIndexes([9, 10, 23])],
      ["Nepali", teacherByIndexes([11, 12, 24])],
      ["Computer", teacherByIndexes([13, 14, 15])],
      ["General Knowledge", teacherByIndexes([16, 17])],
      ["Health & Physical Education", teacherByIndexes([18])],
      ["Optional Mathematics", teacherByIndexes([4, 5, 21])],
    ]);

    const pickTeacherForSubject = (subjectName: string, additionalLoad: number) => {
      const candidatePool = (subjectTeacherPools.get(subjectName) || teacherDocs).filter(Boolean);
      if (candidatePool.length === 0) {
        return null;
      }

      const underCapacity = candidatePool.filter((candidate) => {
        const currentLoad = teacherLoads.get(candidate._id.toString()) || 0;
        return currentLoad + additionalLoad <= MAX_WEEKLY_LOAD_PER_TEACHER;
      });

      const source = underCapacity.length > 0 ? underCapacity : candidatePool;
      let selected = source[0];
      let minLoad = teacherLoads.get(selected._id.toString()) || 0;

      for (const candidate of source) {
        const currentLoad = teacherLoads.get(candidate._id.toString()) || 0;
        if (currentLoad < minLoad) {
          selected = candidate;
          minLoad = currentLoad;
        }
      }

      return selected;
    };

    console.log("Creating School Schedule Config...");
    const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const periodConfigs = [
      { position: 1, startTime: "10:00", endTime: "10:45", isBreak: false, label: "" },
      { position: 2, startTime: "10:45", endTime: "11:30", isBreak: false, label: "" },
      { position: 3, startTime: "11:30", endTime: "12:15", isBreak: false, label: "" },
      { position: 4, startTime: "12:15", endTime: "13:00", isBreak: false, label: "" },
      { position: 5, startTime: "13:00", endTime: "13:50", isBreak: true, label: "Lunch Break" },
      { position: 6, startTime: "13:50", endTime: "14:35", isBreak: false, label: "" },
      { position: 7, startTime: "14:35", endTime: "15:20", isBreak: false, label: "" },
      { position: 8, startTime: "15:20", endTime: "16:05", isBreak: false, label: "" },
      { position: 9, startTime: "16:05", endTime: "16:50", isBreak: false, label: "" },
    ];

    await new SchoolScheduleConfig({
      schoolId: schoolId,
      workingDays,
      periods: periodConfigs,
    }).save();
    console.log("School schedule config saved.");

    console.log("Creating Class Teacher Assignments...");

    for (let csIdx = 0; csIdx < sections.length; csIdx++) {
      const sec = sections[csIdx]!;
      const classTeacherDoc = teacherDocs[csIdx % 25];

      await new ClassTeacherAssignment({
        schoolId,
        classId: sec.classId,
        sectionId: sec._id,
        teacherId: classTeacherDoc._id,
      }).save();
    }
    console.log(`${sections.length} class teacher assignments created.`);

    console.log("Creating Subject-Teacher Mappings with balanced teacher loads...");

    for (let cIdx = 0; cIdx < classes.length; cIdx++) {
      const cls = classes[cIdx]!;
      const classSections = sections.filter(s => s.classId.toString() === cls._id.toString());
      const subs = classSubjectsMap.get(cls._id.toString()) || [];

      for (const sub of subs) {
        const periodsPerWeek = SUBJECT_PERIODS_PER_WEEK[sub.name] ?? 5;
        const projectedLoadIncrement = periodsPerWeek * classSections.length;
        const selectedTeacher = pickTeacherForSubject(sub.name, projectedLoadIncrement);
        if (!selectedTeacher) {
          throw new Error(`Unable to select teacher for subject ${sub.name} in ${cls.name}`);
        }

        for (const sec of classSections) {
          await new SubjectTeacherMapping({
            schoolId,
            classId: cls._id,
            sectionId: sec._id,
            subjectId: sub._id,
            teacherId: selectedTeacher._id,
            periodsPerWeek,
          }).save();
        }

        const currentLoad = teacherLoads.get(selectedTeacher._id.toString()) || 0;
        teacherLoads.set(selectedTeacher._id.toString(), currentLoad + projectedLoadIncrement);
      }
    }

    const sortedLoadSummary = [...teacherLoads.entries()]
      .map(([teacherId, load]) => {
        const teacher = teacherDocs.find((item) => item._id.toString() === teacherId);
        return {
          teacher: teacher?.teacherName || teacherId,
          load,
        };
      })
      .sort((a, b) => b.load - a.load);

    console.log("Top teacher loads:", sortedLoadSummary.slice(0, 5));

    const subjectCountPerClass = await Subject.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: "$classId",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("Subject counts by class:", subjectCountPerClass);

    const mappingCountPerSection = await SubjectTeacherMapping.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: "$sectionId",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log("Mapping counts by section:", mappingCountPerSection.slice(0, 10));

    console.log("Teacher seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding teacher data:", error);
    throw error;
  }
};

export { seedTeachers };

if (require.main === module) {
  const { connectDB, closeDB } = require("../configs/db");
  (async () => {
    await connectDB();
    await seedTeachers();
    await closeDB();
  })();
}

