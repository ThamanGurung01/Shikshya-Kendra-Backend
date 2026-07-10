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

    // --- Configuration for Teacher Workloads ---
    // A standard teacher teaches 5 periods a day (25 periods a week).
    // This perfectly balances the load (e.g. 20 sections / 4 teachers = 5 each)
    // and prevents the 6-mapping bottleneck that causes the generator to fail.
    const MAX_MAPPINGS_PER_TEACHER = 5;

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

    console.log("Calculating required subject-section mappings using ISOLATED BLOCKS...");
    // To prevent the routine generator from failing on 100% dense timetables, we must prevent
    // global interconnected teacher dependencies. 
    // We do this by dividing the 20 sections into completely isolated "blocks" of 4 sections.
    // Teachers assigned to one block will NEVER teach in another block.
    // This breaks the scheduling problem down into 5 trivial sub-problems!

    const sortedSections = [...sections].map(s => {
       const cls = classes.find(c => c._id.toString() === s.classId.toString());
       return {
           ...s,
           classNum: extractClassNumber(cls?.name || ""),
           className: cls?.name || ""
       };
    }).sort((a, b) => {
        if (a.classNum !== b.classNum) return b.classNum - a.classNum; // Descending Class
        return (a.name || "").localeCompare(b.name || "");
    });

    const SECTION_BLOCK_SIZE = 4;
    const sectionBlocks = [];
    for (let i = 0; i < sortedSections.length; i += SECTION_BLOCK_SIZE) {
        sectionBlocks.push(sortedSections.slice(i, i + SECTION_BLOCK_SIZE));
    }

    const teacherChunks: any[][] = [];
    let totalMappings = 0;

    for (const block of sectionBlocks) {
        const subjectsInBlock = new Set<string>();
        const mappingsForBlock: any[] = [];

        for (const sec of block) {
             const subs = classSubjectsMap.get(sec.classId.toString()) || [];
             for (const sub of subs) {
                 subjectsInBlock.add(sub.name);
                 mappingsForBlock.push({
                     classId: sec.classId,
                     sectionId: sec._id,
                     subjectId: sub._id,
                     subjectName: sub.name,
                     classNum: sec.classNum,
                     sectionName: sec.name
                 });
             }
        }

        // For each subject in this isolated block, assign exactly ONE teacher.
        // This teacher will teach this subject to all 4 sections in the block (20 periods/week).
        for (const subjectName of subjectsInBlock) {
             const mappingsForTeacher = mappingsForBlock.filter(m => m.subjectName === subjectName);
             teacherChunks.push(mappingsForTeacher);
             totalMappings += mappingsForTeacher.length;
        }
    }

    const numTeachersNeeded = teacherChunks.length;
    console.log(`Need ${numTeachersNeeded} teachers to cover ${totalMappings} mappings using isolated blocks.`);

    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
    console.log(`Creating ${numTeachersNeeded} Teachers...`);
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
      "Gopal Prasad", "Saraswati Shrestha", "Kamal Thapa",
      "Sushma Karki", "Ramesh Bista", "Sabita Gurung",
      "Bikash Tamang", "Menuka Poudel", "Santosh Rai",
      "Lila Devi", "Nabin Sharma", "Kabita Acharya",
      "Roshan Shrestha", "Sujata Thapa", "Sujan Koirala",
      "Rupa Magar", "Dinesh KC", "Manju Basnet",
      "Anil Gurung", "Sarita Rijal", "Bipin Sharma",
      "Ganga Devi", "Ashok Thapa", "Nirmala Poudel",
      "Surendra Shrestha"
    ];

    const employeePrefix = "TCH";
    const genders = ["Male", "Female"];

    for (let i = 0; i < numTeachersNeeded; i++) {
      // Fallback in case we somehow need more than 50 teachers
      const name = teacherNames[i] || `Teacher ${i + 1}`; 
      const emailName = name.toLowerCase().replace(/\s+/g, ".");

      const tUser = await new User({
        name: name,
        email: `${emailName}@shikshyakendra.edu.np`,
        password: hashedPassword,
        role: "teacher",
        is_active: true,
      }).save();

      const teacherDoc = await new Teacher({
        employeeId: `${employeePrefix}${(i + 1).toString().padStart(3, "0")}`,
        teacherName: name,
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
      const classTeacherDoc = teacherDocs[csIdx % teacherDocs.length];

      await new ClassTeacherAssignment({
        schoolId,
        classId: sec.classId,
        sectionId: sec._id,
        teacherId: classTeacherDoc._id,
      }).save();
    }
    console.log(`${sections.length} class teacher assignments created.`);

    console.log("Saving grouped Subject-Teacher Mappings...");
    const teacherLoads = new Map<string, number>();

    for (let i = 0; i < teacherChunks.length; i++) {
      const chunk = teacherChunks[i]!;
      const teacherDoc = teacherDocs[i]!;
      
      let loadForTeacher = 0;
      for (const req of chunk) {
        const periodsPerWeek = SUBJECT_PERIODS_PER_WEEK[req.subjectName] ?? 5;
        await new SubjectTeacherMapping({
          schoolId,
          classId: req.classId,
          sectionId: req.sectionId,
          subjectId: req.subjectId,
          teacherId: teacherDoc._id,
          periodsPerWeek,
        }).save();
        loadForTeacher += periodsPerWeek;
      }
      teacherLoads.set(teacherDoc._id.toString(), loadForTeacher);
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
    console.log(`Subject counts calculated for ${subjectCountPerClass.length} classes.`);

    const mappingCountPerSection = await SubjectTeacherMapping.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: "$sectionId",
          count: { $sum: 1 },
        },
      },
    ]);
    console.log(`Mapping counts calculated for ${mappingCountPerSection.length} sections.`);

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

