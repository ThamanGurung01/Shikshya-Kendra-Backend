import "dotenv/config";
import { connectDB, closeDB } from "../configs/db";
import { School } from "../models/school.model";
import { AcademicYear } from "../models/academic-year.model";
import { ClassModel as Class } from "../models/class.model";
import { SectionModel as Section } from "../models/section.model";
import { StudentEnrollment } from "../models/student-enrollment.model";
import { Teacher } from "../models/teacher.model";
import { Attendance, IAttendanceRecord } from "../models/attendance.model";

/**
 * Robust Attendance Seeder
 * Generates 35 consecutive days of historical attendance for all active class sections.
 * Guarantees N >= 30 days to test the 30-day sliding window, 7-day warmup guard, and stage alerts.
 */
export const seedAttendance = async () => {
  try {
    console.log("Purging old attendance records...");
    await Attendance.deleteMany({});

    console.log("Fetching school and active academic year...");
    const school = await School.findOne({ school_name: "Shikshya Kendra Model School" }) || await School.findOne();
    if (!school) {
      console.log("❌ School not found. Please run school seeder first.");
      return;
    }

    const academicYear = await AcademicYear.findOne({ schoolId: school._id, isCurrent: true }) || await AcademicYear.findOne({ schoolId: school._id });
    if (!academicYear) {
      console.log("❌ Active Academic Year not found.");
      return;
    }

    const classes = await Class.find({ schoolId: school._id }).lean();
    if (classes.length === 0) {
      console.log("❌ No classes found.");
      return;
    }

    const teachers = await Teacher.find({ schoolId: school._id }).lean();
    const defaultTeacherId = teachers.length > 0 ? teachers[0]!.userId : school._id;

    console.log(`Found ${classes.length} classes. Generating 35 days of historical attendance...`);

    const totalDaysToSeed = 35;
    const now = new Date();
    let totalAttendanceDocsSeeded = 0;
    let totalStudentRecordsSeeded = 0;

    for (const classItem of classes) {
      const sections = await Section.find({ classId: classItem._id }).lean();
      
      for (const sectionItem of sections) {
        const enrollments = await StudentEnrollment.find({
          schoolId: school._id,
          classId: classItem._id,
          sectionId: sectionItem._id,
          academicYearId: academicYear._id,
          studentEnrollmentStatus: "active"
        }).sort({ rollNumber: 1 }).lean();

        if (enrollments.length === 0) continue;

        // Categorize students into realistic risk profiles for demo/test
        // Index 0: Active Consecutive Absence Streak Student (3-5 days absent up to today)
        // Index 1: Warning Deficit Student (~65% attendance rate)
        // Index 2+: Healthy Students (90-95% attendance rate)
        const streakStudentId = enrollments[0]?.studentId?.toString();
        const warningStudentId = enrollments.length > 1 ? enrollments[1]?.studentId?.toString() : undefined;

        for (let dayOffset = totalDaysToSeed - 1; dayOffset >= 0; dayOffset--) {
          const attendanceDate = new Date(now);
          attendanceDate.setDate(now.getDate() - dayOffset);
          attendanceDate.setUTCHours(0, 0, 0, 0);

          // Skip weekends (Saturday & Sunday in standard academic calendar, or Sunday only)
          const dayOfWeek = attendanceDate.getDay();
          if (dayOfWeek === 0) continue; // Skip Sundays

          const records: IAttendanceRecord[] = enrollments.map((env: any, studentIndex: number) => {
            const studentId = env.studentId;
            let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' = 'PRESENT';
            let remarks = "";

            if (studentId.toString() === streakStudentId) {
              // Streak Student: Absent for the last 4 school days up to today
              if (dayOffset <= 4) {
                status = 'ABSENT';
                remarks = `Unexcused absence - Day ${5 - dayOffset} of active streak`;
              } else {
                status = (dayOffset % 5 === 0) ? 'ABSENT' : 'PRESENT';
              }
            } else if (warningStudentId && studentId.toString() === warningStudentId) {
              // Warning Deficit Student: Absent roughly 1 in every 3 days (~65% rate)
              if (dayOffset % 3 === 0) {
                status = 'ABSENT';
                remarks = "Frequent absence logged";
              } else if (dayOffset % 7 === 0) {
                status = 'HALF_DAY';
                remarks = "Left early for medical appointment";
              } else {
                status = 'PRESENT';
              }
            } else {
              // Healthy Student: 92% Present, 5% Late, 3% Absent
              const rand = (studentIndex * 17 + dayOffset * 31) % 100;
              if (rand < 3) {
                status = 'ABSENT';
                remarks = "Parent informed sickness";
              } else if (rand < 8) {
                status = 'LATE';
                remarks = "School bus delayed";
              } else {
                status = 'PRESENT';
              }
            }

            return {
              studentId,
              status,
              remarks
            };
          });

          const attendanceDoc = new Attendance({
            schoolId: school._id,
            academicYearId: academicYear._id,
            classId: classItem._id,
            sectionId: sectionItem._id,
            date: attendanceDate,
            takenBy: defaultTeacherId,
            records
          });

          await attendanceDoc.save();
          totalAttendanceDocsSeeded++;
          totalStudentRecordsSeeded += records.length;
        }
      }
    }

    console.log(`✅ Attendance Seeder finished successfully!`);
    console.log(`   - Seeded ${totalAttendanceDocsSeeded} class-daily attendance sheets.`);
    console.log(`   - Seeded ${totalStudentRecordsSeeded} individual student presence logs across 35 days.`);
  } catch (error) {
    console.error("❌ Attendance Seeder failed:", error);
    throw error;
  }
};

if (require.main === module) {
  connectDB()
    .then(() => seedAttendance())
    .then(() => closeDB())
    .catch((err) => {
      console.error("Attendance Seeder script execution failed:", err);
      process.exit(1);
    });
}
