import { WlmConfig } from '../models/wlm-config.model';
import { GradeHistory } from '../models/grade-history.model';
import { Attendance, IAttendanceRecord } from '../models/attendance.model';
import { AssignmentSubmission } from '../models/assignment-submission.model';
import { Assignment } from '../models/assignment.model';
import { AcademicYear } from '../models/academic-year.model';
import { StudentEnrollment } from '../models/student-enrollment.model';

export interface IWlmBreakdown {
  studentId: string;
  classId?: string;
  sectionId?: string;
  examScore: number;
  attendanceScore: number;
  assignmentScore: number;
  comprehensiveScore: number;
}

/**
 * Calculate WLM scores for all students in a given class+section for a specific result.
 * This function handles ONE class+section.
 * The caller loops through all class+section combos and merges results.
 */
export async function calculateWlmScores(
  resultId: string,
  schoolId: string,
  academicYearId: string,
  classId: string,
  sectionId: string,
  examEndDate: Date,
): Promise<IWlmBreakdown[]> {
  // 1. Load weights (fall back to defaults if no config)
  const config = await WlmConfig.findOne({ schoolId }).lean();
  const weights = {
    exam: config?.examWeight ?? 0.50,
    attendance: config?.attendanceWeight ?? 0.30,
    assignment: config?.assignmentWeight ?? 0.20,
  };

  // 2. Load academic year dates
  const academicYear = await AcademicYear.findById(academicYearId).lean();
  if (!academicYear) throw new Error('Academic year not found');
  const yearStart = new Date(academicYear.startDate);

  // 3. Get enrolled students (only active enrollments for this class/section)
  const enrollments = await StudentEnrollment.find({
    schoolId, academicYearId, classId, sectionId,
    studentEnrollmentStatus: 'active',
  }).lean();

  if (enrollments.length === 0) return [];

  const studentIds = enrollments.map(e => String(e.studentId));
  // Map studentId -> joinedAt for mid-term enrollment handling
  const enrollmentMap = new Map<string, Date | undefined>();
  for (const e of enrollments) {
    enrollmentMap.set(String(e.studentId), e.joinedAt || undefined);
  }

  // 4. Fetch exam grades from GradeHistory for THIS result + class + section
  const grades = await GradeHistory.find({
    resultId, schoolId, classId, sectionId,
  }).lean();

  // Group grades by studentId and compute exam scores
  const examScoreMap = new Map<string, number>();
  const studentGrades = new Map<string, typeof grades>();
  for (const g of grades) {
    const sid = String(g.studentId);
    if (!studentGrades.has(sid)) studentGrades.set(sid, []);
    studentGrades.get(sid)!.push(g);
  }

  for (const [sid, sGrades] of studentGrades) {
    let totalMarks = 0;
    let totalFullMarks = 0;
    for (const g of sGrades) {
      if (g.isAbsent) continue;
      totalMarks += g.totalMarks ?? 0;
      totalFullMarks += g.theoryFullMarks + g.practicalFullMarks;
    }
    // If all absent or no grades, examScore = 0
    const examScore = totalFullMarks > 0
      ? Math.round((totalMarks / totalFullMarks) * 10000) / 100
      : 0;
    examScoreMap.set(sid, examScore);
  }

  // 5. Fetch attendance scoped to academic year
  const attendanceDocs = await Attendance.find({
    schoolId, classId, sectionId, academicYearId,
    date: { $gte: yearStart, $lte: examEndDate },
  }).lean();

  // Compute attendance per student
  const attendanceScoreMap = new Map<string, number>();
  for (const sid of studentIds) {
    // For mid-term students, only count from their joinedAt date
    const joinedAt = enrollmentMap.get(sid);
    const studentStart = joinedAt && joinedAt > yearStart ? joinedAt : yearStart;

    let present = 0;
    let total = 0;

    for (const doc of attendanceDocs) {
      if (doc.date < studentStart) continue;

      const record = doc.records.find(
        (r: IAttendanceRecord) => String(r.studentId) === sid
      );
      if (!record) continue;

      total++;
      switch (record.status) {
        case 'PRESENT':
        case 'LATE':
          present += 1;
          break;
        case 'HALF_DAY':
          present += 0.5;
          break;
        case 'ABSENT':
          present += 0;
          break;
      }
    }

    const score = total > 0
      ? Math.round((present / total) * 10000) / 100
      : 100; // No attendance records → don't penalize
    attendanceScoreMap.set(sid, score);
  }

  // 6. Fetch assignments scoped to academic year date range
  const assignments = await Assignment.find({
    schoolId, classId, sectionId,
    dueDate: { $gte: yearStart, $lte: examEndDate },
  }).lean();

  const assignmentScoreMap = new Map<string, number>();

  if (assignments.length === 0) {
    // No assignments → full marks for everyone
    for (const sid of studentIds) {
      assignmentScoreMap.set(sid, 100);
    }
  } else {
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds },
    }).lean();

    // Map: studentId -> assignmentId -> submission
    const submissionMap = new Map<string, Map<string, typeof submissions[0]>>();
    for (const sub of submissions) {
      const sid = String(sub.studentId);
      if (!submissionMap.has(sid)) submissionMap.set(sid, new Map());
      submissionMap.get(sid)!.set(String(sub.assignmentId), sub);
    }

    const totalAssignments = assignments.length;

    for (const sid of studentIds) {
      const studentSubs = submissionMap.get(sid) || new Map();
      let weightedScore = 0;

      for (const assignment of assignments) {
        const sub = studentSubs.get(String(assignment._id));
        if (!sub) {
          // No submission record at all → treat as PENDING (0)
          weightedScore += 0;
        } else {
          switch (sub.status) {
            case 'COMPLETED':
              weightedScore += 1;
              break;
            case 'SUBMITTED':
              weightedScore += 0.75;
              break;
            case 'REDO':
              weightedScore += 0.25;
              break;
            case 'PENDING':
            default:
              weightedScore += 0;
              break;
          }
        }
      }

      const score = Math.round((weightedScore / totalAssignments) * 10000) / 100;
      assignmentScoreMap.set(sid, score);
    }
  }

  // 7. Apply formula per student
  const results: IWlmBreakdown[] = [];
  for (const sid of studentIds) {
    const examScore = examScoreMap.get(sid) ?? 0;
    const attendanceScore = attendanceScoreMap.get(sid) ?? 0;
    const assignmentScore = assignmentScoreMap.get(sid) ?? 0;

    const comprehensiveScore = Math.round(
      (examScore * weights.exam +
        attendanceScore * weights.attendance +
        assignmentScore * weights.assignment) * 100
    ) / 100;

    results.push({
      studentId: sid,
      classId,
      sectionId,
      examScore,
      attendanceScore,
      assignmentScore,
      comprehensiveScore,
    });
  }

  return results;
}

// --- WLM Config CRUD ---

export async function getWlmConfig(schoolId: string) {
  const config = await WlmConfig.findOne({ schoolId }).lean();
  if (!config) {
    // Return defaults
    return {
      schoolId,
      examWeight: 0.50,
      attendanceWeight: 0.30,
      assignmentWeight: 0.20,
    };
  }
  return config;
}

export async function updateWlmConfig(
  schoolId: string,
  data: { examWeight: number; attendanceWeight: number; assignmentWeight: number },
) {
  const config = await WlmConfig.findOneAndUpdate(
    { schoolId },
    { ...data, schoolId },
    { new: true, upsert: true, runValidators: true },
  );
  return config;
}
