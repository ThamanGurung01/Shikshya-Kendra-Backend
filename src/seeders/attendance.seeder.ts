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

        // Structured Human Flow & Attendance Risk Profiles per Section (Roll 1 to 5):
        // Roll 1 (Index 0): Star Attendee (98-100% attendance, punctual)
        // Roll 2 (Index 1): Regular Performer (92-94% attendance, occasional sick leave)
        // Roll 3 (Index 2): Active Streak Absentee (Absent last 4 school days up to today - High Risk Flag)
        // Roll 4 (Index 3): Chronic Deficit Student (60-65% attendance - Attendance Deficit Warning)
        // Roll 5 (Index 4): Health Leave & Half-Day Student (82-86% attendance, medical checkups)

        for (let dayOffset = totalDaysToSeed - 1; dayOffset >= 0; dayOffset--) {
          const attendanceDate = new Date(now);
          attendanceDate.setDate(now.getDate() - dayOffset);
          attendanceDate.setUTCHours(0, 0, 0, 0);

          // Skip weekends (Sundays in standard academic calendar)
          const dayOfWeek = attendanceDate.getDay();
          if (dayOfWeek === 0) continue; // Skip Sundays

          const records: IAttendanceRecord[] = enrollments.map((env: any, studentIndex: number) => {
            const studentId = env.studentId;
            let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' = 'PRESENT';
            let remarks = "";

            if (studentIndex === 0) {
              // Roll 1: Top Attendee (98-100% presence)
              if (dayOffset % 15 === 0) {
                status = 'LATE';
                remarks = "Traffic congestion at Lazimpat";
              } else {
                status = 'PRESENT';
                remarks = "";
              }
            } else if (studentIndex === 1) {
              // Roll 2: Good Performer (92-94% presence)
              if (dayOffset === 12 || dayOffset === 25) {
                status = 'ABSENT';
                remarks = "Parent informed sickness - High fever";
              } else if (dayOffset % 9 === 0) {
                status = 'LATE';
                remarks = "School van delayed";
              } else {
                status = 'PRESENT';
                remarks = "";
              }
            } else if (studentIndex === 2) {
              // Roll 3: Active Streak Absentee (Absent last 4 school days up to today)
              if (dayOffset <= 4) {
                status = 'ABSENT';
                remarks = `Unexcused absence - Day ${5 - dayOffset} of active streak`;
              } else if (dayOffset % 6 === 0) {
                status = 'ABSENT';
                remarks = "Unexcused absence - Parent unreachable";
              } else {
                status = 'PRESENT';
                remarks = "";
              }
            } else if (studentIndex === 3) {
              // Roll 4: Chronic Deficit Student (~62% presence - Warning Deficit)
              if (dayOffset % 3 === 0) {
                status = 'ABSENT';
                remarks = "Unexcused absence logged";
              } else if (dayOffset % 7 === 0) {
                status = 'LATE';
                remarks = "Missed morning assembly";
              } else {
                status = 'PRESENT';
                remarks = "";
              }
            } else if (studentIndex === 4) {
              // Roll 5: Health Leave / Half-Day Student (~84% presence)
              if (dayOffset % 8 === 0) {
                status = 'HALF_DAY';
                remarks = "Left early - Dental appointment";
              } else if (dayOffset % 11 === 0) {
                status = 'ABSENT';
                remarks = "Doctor advised bed rest - Migraine";
              } else {
                status = 'PRESENT';
                remarks = "";
              }
            } else {
              // Fallback for roll numbers 6+
              const rand = (studentIndex * 17 + dayOffset * 31) % 100;
              if (rand < 4) {
                status = 'ABSENT';
                remarks = "Parent informed sickness";
              } else if (rand < 9) {
                status = 'LATE';
                remarks = "Heavy morning rain";
              } else if (rand < 13) {
                status = 'HALF_DAY';
                remarks = "Family medical emergency";
              } else {
                status = 'PRESENT';
                remarks = "";
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
