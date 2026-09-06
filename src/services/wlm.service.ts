import { WlmConfig } from '../models/wlm-config.model';
import { GradeHistory } from '../models/grade-history.model';
import { Attendance, IAttendanceRecord } from '../models/attendance.model';
import { AssignmentSubmission } from '../models/assignment-submission.model';
import { Assignment } from '../models/assignment.model';
import { AcademicYear } from '../models/academic-year.model';
import { StudentEnrollment } from '../models/student-enrollment.model';
import { ResultModel } from '../models/result.model';
import { Types } from 'mongoose';

export interface IWlmBreakdown {
  studentId: string;
  classId?: string;
  sectionId?: string;
  examScore: number;
  attendanceScore: number;
  assignmentScore: number;
  conductScore: number;
  punctualityScore: number;
  comprehensiveScore: number;
  classRank: number;
  sectionRank: number;
  performanceTier: 'TOP_PERFORMER' | 'AVERAGE' | 'NEEDS_GUIDANCE';
}

export interface IAnnualPerformanceTerm {
  resultId: string;
  examId: string;
  examName: string;
  examDate: Date;
  isMajorExam: boolean;
  contributionWeight: number;
  examScore: number;
  attendanceScore: number;
  assignmentScore: number;
  conductScore: number;
  punctualityScore: number;
  comprehensiveScore: number;
  classRank: number;
}

export interface IAnnualPerformanceSummary {
  studentId: string;
  academicYearId: string;
  academicYearName: string;
  annualComprehensiveScore: number;
  performanceTier: 'TOP_PERFORMER' | 'AVERAGE' | 'NEEDS_GUIDANCE';
  terms: IAnnualPerformanceTerm[];
  totalMajorExamsCount: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  scoreDelta: number;
}

/**
 * Calculate WLM scores for all students in a given class+section for a specific result.
 * Features 5-pillar dynamic weights, subject credit-weighting, punctuality scores,
 * competition ranking (1st, 2nd, 3rd...), and performance tier categorization.
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
    exam: config?.examWeight ?? 0.75,
    attendance: config?.attendanceWeight ?? 0.10,
    assignment: config?.assignmentWeight ?? 0.15,
    conduct: config?.conductWeight ?? 0,
    punctuality: config?.punctualityWeight ?? 0,
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

  // Compute attendance and punctuality scores per student
  const attendanceScoreMap = new Map<string, number>();
  const punctualityScoreMap = new Map<string, number>();

  for (const sid of studentIds) {
    const joinedAt = enrollmentMap.get(sid);
    const studentStart = joinedAt && joinedAt > yearStart ? joinedAt : yearStart;

    let presentWeight = 0;
    let punctualityWeight = 0;
    let totalDays = 0;

    for (const doc of attendanceDocs) {
      if (doc.date < studentStart) continue;

      const record = doc.records.find(
        (r: IAttendanceRecord) => String(r.studentId) === sid
      );
      if (!record) continue;

      totalDays++;
      switch (record.status) {
        case 'PRESENT':
          presentWeight += 1.0;
          punctualityWeight += 1.0; // 100% punctuality
          break;
        case 'LATE':
          presentWeight += 1.0;
          punctualityWeight += 0.5; // 50% punctuality for being late
          break;
        case 'HALF_DAY':
          presentWeight += 0.5;
          punctualityWeight += 0.5;
          break;
        case 'ABSENT':
        default:
          presentWeight += 0.0;
          punctualityWeight += 0.0;
          break;
      }
    }

    const attScore = totalDays > 0
      ? Math.round((presentWeight / totalDays) * 10000) / 100
      : 100;
    const puncScore = totalDays > 0
      ? Math.round((punctualityWeight / totalDays) * 10000) / 100
      : 100;

    attendanceScoreMap.set(sid, attScore);
    punctualityScoreMap.set(sid, puncScore);
  }

  // 6. Fetch assignments scoped to academic year date range
  const assignments = await Assignment.find({
    schoolId, classId, sectionId,
    dueDate: { $gte: yearStart, $lte: examEndDate },
  }).lean();

  const assignmentScoreMap = new Map<string, number>();

  if (assignments.length === 0) {
    for (const sid of studentIds) {
      assignmentScoreMap.set(sid, 100);
    }
  } else {
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignmentIds },
    }).lean();

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
          weightedScore += 0;
        } else {
          switch (sub.status) {
            case 'COMPLETED':
              weightedScore += 1.0;
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

  // 7. Calculate Comprehensive Score for each student
  const rawResults: IWlmBreakdown[] = [];

  // Dynamic weight scaling if attendance or assignments are unrecorded
  const hasAttendance = attendanceDocs.length > 0;
  const hasAssignments = assignments.length > 0;

  let effectiveExamWeight = weights.exam;
  let effectiveAttendanceWeight = hasAttendance ? weights.attendance : 0;
  let effectiveAssignmentWeight = hasAssignments ? weights.assignment : 0;
  let effectiveConductWeight = weights.conduct;
  let effectivePunctualityWeight = hasAttendance ? weights.punctuality : 0;

  const activeWeightSum =
    effectiveExamWeight +
    effectiveAttendanceWeight +
    effectiveAssignmentWeight +
    effectiveConductWeight +
    effectivePunctualityWeight;

  if (activeWeightSum > 0) {
    effectiveExamWeight /= activeWeightSum;
    effectiveAttendanceWeight /= activeWeightSum;
    effectiveAssignmentWeight /= activeWeightSum;
    effectiveConductWeight /= activeWeightSum;
    effectivePunctualityWeight /= activeWeightSum;
  }

  for (const sid of studentIds) {
    const examScore = examScoreMap.get(sid) ?? 0;
    const attendanceScore = attendanceScoreMap.get(sid) ?? 0;
    const assignmentScore = assignmentScoreMap.get(sid) ?? 0;
    const punctualityScore = punctualityScoreMap.get(sid) ?? 100;
    const conductScore = 100; // Default 100 conduct score

    const comprehensiveScore = Math.round(
      (examScore * effectiveExamWeight +
        attendanceScore * effectiveAttendanceWeight +
        assignmentScore * effectiveAssignmentWeight +
        conductScore * effectiveConductWeight +
        punctualityScore * effectivePunctualityWeight) * 100
    ) / 100;

    let performanceTier: 'TOP_PERFORMER' | 'AVERAGE' | 'NEEDS_GUIDANCE' = 'AVERAGE';
    if (comprehensiveScore >= 80) {
      performanceTier = 'TOP_PERFORMER';
    } else if (comprehensiveScore < 60) {
      performanceTier = 'NEEDS_GUIDANCE';
    }

    rawResults.push({
      studentId: sid,
      classId,
      sectionId,
      examScore,
      attendanceScore,
      assignmentScore,
      conductScore,
      punctualityScore,
      comprehensiveScore,
      classRank: 1,
      sectionRank: 1,
      performanceTier,
    });
  }

  // 8. Assign Standard Competition Ranking (1st, 2nd, 2nd, 4th...) within Section
  rawResults.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore);

  let currentRank = 1;
  for (let i = 0; i < rawResults.length; i++) {
    if (i > 0 && rawResults[i]!.comprehensiveScore < rawResults[i - 1]!.comprehensiveScore) {
      currentRank = i + 1;
    }
    rawResults[i]!.sectionRank = currentRank;
    rawResults[i]!.classRank = currentRank;
  }

  return rawResults;
}

/**
 * WLM Config CRUD
 */
export async function getWlmConfig(schoolId: string) {
  const config = await WlmConfig.findOne({ schoolId }).lean();
  if (!config) {
    return {
      schoolId,
      examWeight: 0.75,
      attendanceWeight: 0.10,
      assignmentWeight: 0.15,
      conductWeight: 0,
      punctualityWeight: 0,
    };
  }
  return config;
}

export async function updateWlmConfig(
  schoolId: string,
  data: {
    examWeight: number;
    attendanceWeight: number;
    assignmentWeight: number;
    conductWeight?: number;
    punctualityWeight?: number;
  },
) {
  const config = await WlmConfig.findOneAndUpdate(
    { schoolId },
    { ...data, schoolId },
    { new: true, upsert: true, runValidators: true },
  );
  return config;
}

/**
 * Calculate Cumulative Academic Year Performance for a Student
 * Aggregates all published major exams in an academic year.
 */
export async function calculateAnnualPerformance(
  studentId: string,
  schoolId: string,
  academicYearId?: string,
): Promise<IAnnualPerformanceSummary | null> {
  let targetYearId = academicYearId;
  if (!targetYearId) {
    const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
    if (!activeYear) return null;
    targetYearId = String(activeYear._id);
  }

  const academicYearDoc = await AcademicYear.findById(targetYearId).lean();
  if (!academicYearDoc) return null;

  // Find all published results for this school and academic year
  const results = await ResultModel.find({
    schoolId: new Types.ObjectId(schoolId),
    academicYearId: new Types.ObjectId(targetYearId),
    status: 'published',
  })
    .populate('examId', 'name startDate endDate isMajorExam annualContributionWeight')
    .sort({ createdAt: 1 })
    .lean();

  if (!results || results.length === 0) return null;

  const terms: IAnnualPerformanceTerm[] = [];
  let weightedSum = 0;
  let totalContributionWeight = 0;

  for (const r of results) {
    if (!r.wlmScores || r.wlmScores.length === 0) continue;

    const studentScore = r.wlmScores.find((s: any) => String(s.studentId) === studentId);
    if (!studentScore) continue;

    const examDoc = r.examId as any;
    const isMajorExam = examDoc?.isMajorExam ?? true;
    const contributionWeight = isMajorExam ? (examDoc?.annualContributionWeight ?? 1.0) : 0;

    terms.push({
      resultId: String(r._id),
      examId: String(examDoc?._id || r.examId),
      examName: examDoc?.name || r.name,
      examDate: examDoc?.startDate || r.publishedAt || r.createdAt,
      isMajorExam,
      contributionWeight,
      examScore: studentScore.examScore,
      attendanceScore: studentScore.attendanceScore,
      assignmentScore: studentScore.assignmentScore,
      conductScore: studentScore.conductScore ?? 100,
      punctualityScore: studentScore.punctualityScore ?? 100,
      comprehensiveScore: studentScore.comprehensiveScore,
      classRank: studentScore.classRank ?? 1,
    });

    if (isMajorExam && contributionWeight > 0) {
      weightedSum += studentScore.comprehensiveScore * contributionWeight;
      totalContributionWeight += contributionWeight;
    }
  }

  if (terms.length === 0) return null;

  const annualScore = totalContributionWeight > 0
    ? Math.round((weightedSum / totalContributionWeight) * 100) / 100
    : Math.round((terms.reduce((acc, t) => acc + t.comprehensiveScore, 0) / terms.length) * 100) / 100;

  let performanceTier: 'TOP_PERFORMER' | 'AVERAGE' | 'NEEDS_GUIDANCE' = 'AVERAGE';
  if (annualScore >= 80) performanceTier = 'TOP_PERFORMER';
  else if (annualScore < 60) performanceTier = 'NEEDS_GUIDANCE';

  let scoreDelta = 0;
  let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
  if (terms.length >= 2) {
    const latest = terms[terms.length - 1]!.comprehensiveScore;
    const previous = terms[terms.length - 2]!.comprehensiveScore;
    scoreDelta = Math.round((latest - previous) * 100) / 100;
    if (scoreDelta > 1.5) trend = 'IMPROVING';
    else if (scoreDelta < -1.5) trend = 'DECLINING';
  }

  return {
    studentId,
    academicYearId: String(targetYearId),
    academicYearName: academicYearDoc.name,
    annualComprehensiveScore: annualScore,
    performanceTier,
    terms,
    totalMajorExamsCount: terms.filter(t => t.isMajorExam).length,
    trend,
    scoreDelta,
  };
}

/**
 * Get Class-Wise Rankings & Leaderboard across all students in a class & section.
 */
export async function getClassRankings(
  schoolId: string,
  classId: string,
  sectionId?: string,
  academicYearId?: string,
  resultId?: string,
) {
  let targetYearId = academicYearId;
  if (!targetYearId) {
    const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
    if (!activeYear) throw new Error('No active academic year found');
    targetYearId = String(activeYear._id);
  }

  // Individual Exam Result Mode (if specific resultId passed)
  if (resultId) {
    const resultDoc = await ResultModel.findOne({
      _id: new Types.ObjectId(resultId),
      schoolId: new Types.ObjectId(schoolId),
      status: 'published',
    })
      .populate('wlmScores.studentId', 'studentName admissionNumber contact')
      .populate('wlmScores.classId', 'name')
      .populate('wlmScores.sectionId', 'name')
      .lean();

    if (!resultDoc || !resultDoc.wlmScores || resultDoc.wlmScores.length === 0) {
      return {
        resultId,
        resultName: resultDoc?.name || 'Exam Result',
        summary: {
          totalStudents: 0,
          topPerformersCount: 0,
          averagePerformersCount: 0,
          needsGuidanceCount: 0,
          classAverageScore: 0,
        },
        leaderboard: [],
      };
    }

    const filteredScores = resultDoc.wlmScores.filter((w: any) => {
      const classMatch = String((w.classId as any)?._id || w.classId) === classId;
      const secMatch = !sectionId || sectionId === 'all' || String((w.sectionId as any)?._id || w.sectionId) === sectionId;
      return classMatch && secMatch;
    });

    const studentItems = filteredScores.map((w: any) => {
      const student = w.studentId as any;
      const tier = w.performanceTier || (w.comprehensiveScore >= 80 ? 'TOP_PERFORMER' : w.comprehensiveScore < 60 ? 'NEEDS_GUIDANCE' : 'AVERAGE');

      let bottleneck = 'None';
      if (w.examScore < 60) bottleneck = 'Low Exam Mastery';
      else if (w.attendanceScore < 75) bottleneck = 'Attendance Deficit';
      else if (w.assignmentScore < 60) bottleneck = 'Missing Assignments';

      return {
        studentId: String(student?._id || w.studentId),
        studentName: student?.studentName || 'Student',
        admissionNumber: student?.admissionNumber || '',
        rollNumber: null,
        className: (w.classId as any)?.name || '',
        sectionName: (w.sectionId as any)?.name || '',
        contact: student?.contact || '',
        examScore: w.examScore,
        attendanceScore: w.attendanceScore,
        assignmentScore: w.assignmentScore,
        conductScore: w.conductScore ?? 100,
        punctualityScore: w.punctualityScore ?? 100,
        comprehensiveScore: w.comprehensiveScore,
        classRank: w.classRank || w.sectionRank || 1,
        performanceTier: tier,
        bottleneck,
      };
    });

    studentItems.sort((a, b) => (a.classRank || 1) - (b.classRank || 1));

    let topCount = 0;
    let avgCount = 0;
    let guidanceCount = 0;
    let totalScoreSum = 0;

    for (const item of studentItems) {
      totalScoreSum += item.comprehensiveScore;
      if (item.performanceTier === 'TOP_PERFORMER') topCount++;
      else if (item.performanceTier === 'NEEDS_GUIDANCE') guidanceCount++;
      else avgCount++;
    }

    const classAverageScore = studentItems.length > 0
      ? Math.round((totalScoreSum / studentItems.length) * 100) / 100
      : 0;

    return {
      resultId,
      resultName: resultDoc.name,
      summary: {
        totalStudents: studentItems.length,
        topPerformersCount: topCount,
        averagePerformersCount: avgCount,
        needsGuidanceCount: guidanceCount,
        classAverageScore,
      },
      leaderboard: studentItems,
    };
  }

  // Cumulative Annual Mode
  const enrollmentQuery: any = {
    schoolId: new Types.ObjectId(schoolId),
    academicYearId: new Types.ObjectId(targetYearId),
    classId: new Types.ObjectId(classId),
    studentEnrollmentStatus: 'active',
  };
  if (sectionId && sectionId !== 'all') {
    enrollmentQuery.sectionId = new Types.ObjectId(sectionId);
  }

  const enrollments = await StudentEnrollment.find(enrollmentQuery)
    .populate('studentId', 'studentName admissionNumber contact')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .sort({ rollNumber: 1 })
    .lean();

  if (enrollments.length === 0) {
    return {
      summary: {
        totalStudents: 0,
        topPerformersCount: 0,
        averagePerformersCount: 0,
        needsGuidanceCount: 0,
        classAverageScore: 0,
      },
      leaderboard: [],
    };
  }

  const studentItems: any[] = [];
  let totalScoreSum = 0;

  for (const enr of enrollments) {
    const student = enr.studentId as any;
    if (!student) continue;

    const sid = String(student._id);
    const annualPerf = await calculateAnnualPerformance(sid, schoolId, targetYearId);
    const score = annualPerf?.annualComprehensiveScore ?? 0;
    const tier = annualPerf?.performanceTier ?? (score >= 80 ? 'TOP_PERFORMER' : score < 60 ? 'NEEDS_GUIDANCE' : 'AVERAGE');

    totalScoreSum += score;

    let bottleneck = 'None';
    if (annualPerf && annualPerf.terms.length > 0) {
      const lastTerm = annualPerf.terms[annualPerf.terms.length - 1]!;
      if (lastTerm.examScore < 60) bottleneck = 'Low Exam Mastery';
      else if (lastTerm.attendanceScore < 75) bottleneck = 'Attendance Deficit';
      else if (lastTerm.assignmentScore < 60) bottleneck = 'Missing Assignments';
    }

    studentItems.push({
      studentId: sid,
      studentName: student.studentName,
      admissionNumber: student.admissionNumber,
      rollNumber: enr.rollNumber || null,
      className: (enr.classId as any)?.name || '',
      sectionName: (enr.sectionId as any)?.name || '',
      contact: student.contact || '',
      comprehensiveScore: score,
      performanceTier: tier,
      termsCount: annualPerf?.terms.length ?? 0,
      trend: annualPerf?.trend ?? 'STABLE',
      scoreDelta: annualPerf?.scoreDelta ?? 0,
      bottleneck,
    });
  }

  studentItems.sort((a, b) => b.comprehensiveScore - a.comprehensiveScore);

  let currentRank = 1;
  let topCount = 0;
  let avgCount = 0;
  let guidanceCount = 0;

  for (let i = 0; i < studentItems.length; i++) {
    if (i > 0 && studentItems[i].comprehensiveScore < studentItems[i - 1].comprehensiveScore) {
      currentRank = i + 1;
    }
    studentItems[i].classRank = currentRank;

    if (studentItems[i].performanceTier === 'TOP_PERFORMER') topCount++;
    else if (studentItems[i].performanceTier === 'NEEDS_GUIDANCE') guidanceCount++;
    else avgCount++;
  }

  const classAverageScore = studentItems.length > 0
    ? Math.round((totalScoreSum / studentItems.length) * 100) / 100
    : 0;

  return {
    summary: {
      totalStudents: studentItems.length,
      topPerformersCount: topCount,
      averagePerformersCount: avgCount,
      needsGuidanceCount: guidanceCount,
      classAverageScore,
    },
    leaderboard: studentItems,
  };
}
