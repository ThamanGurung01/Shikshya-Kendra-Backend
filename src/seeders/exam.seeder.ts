import "dotenv/config";
import { connectDB, closeDB } from "../configs/db";
import { School } from "../models/school.model";
import { AcademicYear } from "../models/academic-year.model";
import { ClassModel as Class } from "../models/class.model";
import { SubjectModel as Subject } from "../models/subject.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { SectionModel as Section } from "../models/section.model";
import { Teacher } from "../models/teacher.model";
import { ExamModel } from "../models/exam.model";
import { ResultModel } from "../models/result.model";
import { GradeAssignment } from "../models/grade-assignment.model";
import { User } from "../models/user.model";
import { ExamRoutineModel } from "../models/exam-routine.model";
import { GradeHistory } from "../models/grade-history.model";
import { SubjectTeacherMapping } from "../models/subject-teacher-mapping.model";

export const seedExams = async () => {
  try {
    console.log("Purging old exam data...");
    await ExamModel.deleteMany({});
    await ResultModel.deleteMany({});
    await GradeAssignment.deleteMany({});
    await ExamRoutineModel.deleteMany({});
    await GradeHistory.deleteMany({});

    console.log("Fetching school and academic year...");
    const school = await School.findOne({ school_name: "Shikshya Kendra Model School" });
    if (!school) {
      console.log("School not found. Please run school seeder first.");
      return;
    }

    const academicYear = await AcademicYear.findOne({ schoolId: school._id });
    if (!academicYear) {
      console.log("Academic Year not found.");
      return;
    }

    const classes = await Class.find({ schoolId: school._id });
    if (classes.length === 0) {
      console.log("No classes found.");
      return;
    }

    const subjects = await Subject.find({ schoolId: school._id });
    if (subjects.length === 0) {
      console.log("No subjects found.");
      return;
    }

    // Load all teachers into a map for O(1) lookup by ID
    const allTeachers = await Teacher.find({ schoolId: school._id }).lean();
    if (allTeachers.length === 0) {
      console.log("No teachers found. Please run teacher seeder first.");
      return;
    }
    const teacherMap = new Map<string, any>(allTeachers.map(t => [t._id.toString(), t]));
    const fallbackTeacher = allTeachers[0]!;

    // Load all subject-teacher mappings into a composite-key map:
    //   key = `${classId}|${sectionId}|${subjectId}` → teacherId
    // This avoids hundreds of individual DB queries inside the nested loops.
    const allMappings = await SubjectTeacherMapping.find({ schoolId: school._id }).lean();
    const mappingTeacherMap = new Map<string, string>();
    for (const m of allMappings) {
      const key = `${m.classId}|${m.sectionId}|${m.subjectId}`;
      mappingTeacherMap.set(key, m.teacherId.toString());
    }
    console.log(`Loaded ${allMappings.length} subject-teacher mappings for grade assignment.`);

    const adminUser = await User.findOne({ email: "admin@shikshyakendra.edu.np" });
    const createdByUserId = adminUser ? adminUser._id : fallbackTeacher.userId;

    console.log("Creating Exam...");
    const examConfiguration = classes.map(c => ({
      classId: c._id as any,
      subjects: subjects.filter(sub => sub.classId.toString() === c._id.toString()).map(sub => ({
        subjectId: sub._id as any,
        theoryFullMarks: 75,
        theoryPassMarks: 30,
        practicalFullMarks: 25,
        practicalPassMarks: 10,
      }))
    }));

    const examStartDate = new Date();
    const examEndDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const classTimes = classes.map(c => ({
        classId: c._id,
        startTime: "10:00 AM",
        endTime: "01:00 PM"
    }));

    const exam = await new ExamModel({
      schoolId: school._id,
      academicYearId: academicYear._id,
      name: "First Term Examination 2081",
      classes: classes.map(c => c._id),
      startDate: examStartDate,
      endDate: examEndDate,
      allowedDays: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      status: "ended",
      gradingSystem: "percentage",
      examType: "terminal",
      isMajorExam: true,
      annualContributionWeight: 1.0,
      examConfiguration,
      classTimes
    }).save();

    console.log(`Exam created with ID: ${exam._id}`);

    console.log("Creating Exam Routines...");
    for (const cls of classes) {
      let dayOffset = 0;
      const classSubjects = subjects.filter(sub => sub.classId.toString() === cls._id.toString());
      for (const sub of classSubjects) {
        await new ExamRoutineModel({
          schoolId: school._id,
          examId: exam._id,
          classId: cls._id,
          subjectId: sub._id,
          date: new Date(examStartDate.getTime() + dayOffset * 24 * 60 * 60 * 1000),
          startTime: "10:00 AM",
          endTime: "01:00 PM",
          roomNumber: `Room ${101 + dayOffset}`
        }).save();
        dayOffset++;
      }
    }

    console.log("Creating Result...");
    const result = await new ResultModel({
      schoolId: school._id,
      academicYearId: academicYear._id,
      examId: exam._id,
      name: "First Term Result 2081",
      classIds: classes.map(c => c._id),
      status: "published",
      publishedAt: new Date(),
      createdBy: createdByUserId,
    }).save();
    console.log(`Result created with ID: ${result._id}`);

    const subjectMap = new Map<string, any>(subjects.map(s => [s._id.toString(), s]));

    console.log("Creating Grade Assignments and Histories with Performance Tiers...");
    for (const cls of classes) {
      const sections = await Section.find({ classId: cls._id });
      for (const section of sections) {
        const enrollments = await StudentEnrollment.find({ 
          schoolId: school._id, 
          academicYearId: academicYear._id, 
          classId: cls._id,
          sectionId: section._id 
        }).sort({ rollNumber: 1 });

        const classConfig = examConfiguration.find(ec => ec.classId.toString() === cls._id.toString());
        if (!classConfig) continue;

        let skippedNoMapping = 0;
        for (let subIdx = 0; subIdx < classConfig.subjects.length; subIdx++) {
          const subConfig = classConfig.subjects[subIdx]!;
          const subjectObj = subjectMap.get(subConfig.subjectId.toString());
          const subjectName = subjectObj?.name || "";
          const isCoreSubject = ["Mathematics", "Science", "Optional Mathematics", "English"].includes(subjectName);

          // Resolve the teacher via in-memory map (keyed by classId|sectionId|subjectId)
          const mappingKey = `${cls._id}|${section._id}|${subConfig.subjectId}`;
          const mappedTeacherId = mappingTeacherMap.get(mappingKey);
          if (!mappedTeacherId) skippedNoMapping++;
          const assignmentTeacherId = mappedTeacherId ?? fallbackTeacher._id.toString();

          const entries = enrollments.map((enroll, enrollIndex) => {
            let theoryMarks: number | null = null;
            let practicalMarks: number | null = null;
            let totalMarks: number | null = null;
            let isAbsent = false;
            let remarks = "Good";

            if (enrollIndex === 0) {
              // Roll 1: Top Performer (90-98%)
              theoryMarks = Math.floor(Math.random() * 8) + 67; // 67 to 74
              practicalMarks = Math.floor(Math.random() * 3) + 23; // 23 to 25
              totalMarks = theoryMarks + practicalMarks;
              isAbsent = false;
              remarks = "Outstanding academic performance";
            } else if (enrollIndex === 1) {
              // Roll 2: Good / Above Average Performer (72-85%)
              theoryMarks = Math.floor(Math.random() * 11) + 53; // 53 to 63
              practicalMarks = Math.floor(Math.random() * 5) + 18; // 18 to 22
              totalMarks = theoryMarks + practicalMarks;
              isAbsent = false;
              remarks = "Good performance, solid conceptual grasp";
            } else if (enrollIndex === 2) {
              // Roll 3: Mid Performer / Average (56-69%)
              theoryMarks = Math.floor(Math.random() * 10) + 42; // 42 to 51
              practicalMarks = Math.floor(Math.random() * 5) + 14; // 14 to 18
              totalMarks = theoryMarks + practicalMarks;
              isAbsent = false;
              remarks = "Average score, scope for improvement in theory";
            } else if (enrollIndex === 3) {
              // Roll 4: Failing / Struggling Student (Fails in core subjects)
              if (isCoreSubject) {
                theoryMarks = Math.floor(Math.random() * 12) + 16; // 16 to 27 (Below theory pass mark 30!)
                practicalMarks = Math.floor(Math.random() * 5) + 8; // 8 to 12
                totalMarks = theoryMarks + practicalMarks; // 24 to 39 (Failing grade)
                isAbsent = false;
                remarks = "Failed theory pass mark. Requires academic support";
              } else {
                theoryMarks = Math.floor(Math.random() * 5) + 31; // 31 to 35 (Barely passed)
                practicalMarks = Math.floor(Math.random() * 4) + 10; // 10 to 13
                totalMarks = theoryMarks + practicalMarks;
                isAbsent = false;
                remarks = "Needs focused improvement";
              }
            } else if (enrollIndex === 4) {
              // Roll 5: Borderline Pass / Occasional Exam Absentee
              if (subIdx === 2) {
                // Absent for 3rd subject exam
                isAbsent = true;
                theoryMarks = null;
                practicalMarks = null;
                totalMarks = null;
                remarks = "Absent for examination";
              } else {
                theoryMarks = Math.floor(Math.random() * 7) + 30; // 30 to 36 (Barely pass)
                practicalMarks = Math.floor(Math.random() * 4) + 10; // 10 to 13
                totalMarks = theoryMarks + practicalMarks;
                isAbsent = false;
                remarks = "Borderline pass mark";
              }
            } else {
              // Fallback for roll numbers 6+
              if (enrollIndex % 3 === 0) {
                theoryMarks = Math.floor(Math.random() * 10) + 60;
                practicalMarks = Math.floor(Math.random() * 5) + 20;
                totalMarks = theoryMarks + practicalMarks;
                isAbsent = false;
                remarks = "Good performance";
              } else if (enrollIndex % 3 === 1) {
                theoryMarks = Math.floor(Math.random() * 10) + 40;
                practicalMarks = Math.floor(Math.random() * 5) + 15;
                totalMarks = theoryMarks + practicalMarks;
                isAbsent = false;
                remarks = "Average performance";
              } else {
                theoryMarks = Math.floor(Math.random() * 10) + 22;
                practicalMarks = Math.floor(Math.random() * 5) + 9;
                totalMarks = theoryMarks + practicalMarks;
                isAbsent = false;
                remarks = "Needs academic support";
              }
            }

            return {
              studentId: enroll.studentId,
              enrollmentId: enroll._id,
              theoryMarks,
              practicalMarks,
              totalMarks,
              isAbsent,
              remarks,
            };
          });

          if (entries.length > 0) {
            const assignment = await new GradeAssignment({
              schoolId: school._id,
              resultId: result._id,
              examId: exam._id,
              teacherId: assignmentTeacherId,
              classId: cls._id,
              sectionId: section._id,
              subjectId: subConfig.subjectId,
              status: "finalized",
              finalizedAt: new Date(),
              entries
            }).save();

            for (const entry of entries) {
              await new GradeHistory({
                schoolId: school._id,
                resultId: result._id,
                gradeAssignmentId: assignment._id,
                examId: exam._id,
                studentId: entry.studentId,
                enrollmentId: entry.enrollmentId,
                classId: cls._id,
                sectionId: section._id,
                subjectId: subConfig.subjectId,
                teacherId: assignmentTeacherId,
                theoryMarks: entry.theoryMarks,
                practicalMarks: entry.practicalMarks,
                totalMarks: entry.totalMarks,
                theoryFullMarks: subConfig.theoryFullMarks,
                practicalFullMarks: subConfig.practicalFullMarks,
                isAbsent: entry.isAbsent,
                remarks: entry.remarks,
                version: 1,
                gradedAt: assignment.finalizedAt
              }).save();
            }
          }
        }
      }
    }

    if (allMappings.length === 0) {
      console.warn("  ⚠  No SubjectTeacherMappings found — all grade assignments used fallback teacher. Run teacher seeder first for accurate mappings.");
    }
    console.log("Grade assignments and histories created successfully.");

    console.log("Calculating WLM scores for seeded result...");
    const { calculateWlmScores } = await import("../services/wlm.service");
    const allWlmScores: any[] = [];
    for (const cls of classes) {
      const classSections = await Section.find({ classId: cls._id });
      for (const section of classSections) {
        const scores = await calculateWlmScores(
          result._id.toString(),
          school._id.toString(),
          academicYear._id.toString(),
          cls._id.toString(),
          section._id.toString(),
          examEndDate,
        );
        allWlmScores.push(...scores);
      }
    }
    result.wlmScores = allWlmScores;
    await result.save();
    console.log(`Calculated and stored WLM scores for ${allWlmScores.length} students in the seeded result.`);
  } catch (error) {
    console.error("Error in exam seeder:", error);
  }
};

if (require.main === module) {
  connectDB().then(() => {
    seedExams().then(() => closeDB());
  });
}
