export type AttendanceStatusType = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

export interface RawAttendanceItem {
  date: Date;
  status: AttendanceStatusType;
  remarks?: string | undefined;
}


export interface WindowPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  status: AttendanceStatusType;
  rollingRate: number; // 0 to 100 percentage
  windowTotalDays: number;
  windowPresentDays: number;
  isDeficit: boolean;
}

export interface StreakInfo {
  currentActiveStreak: number;
  maxHistoricalStreak: number;
  lastAbsentDate?: string | undefined;
  isStreakActive: boolean; // True if student is currently absent on the latest recorded day
}


export interface AttendanceStageAlert {
  alertId: string;
  studentId: string;
  stage: 'STAGE_1_STREAK' | 'STAGE_2_WARNING' | 'STAGE_3_CRITICAL';
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  actionRequired: string;
  triggeredAt: string;
}

export interface StudentSlidingWindowResult {
  studentId: string;
  totalRecordsAnalyzed: number;
  hasSufficientData: boolean;
  minSampleDays: number;
  insufficientDataReason?: string | undefined;
  overallAttendanceRate: number;
  lowestRolling30DayRate: number;
  currentRolling30DayRate: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  streakInfo: StreakInfo;
  stageAlerts: AttendanceStageAlert[];
  flaggedDeficitWindows: {
    startDate: string;
    endDate: string;
    rate: number;
    absentDays: number;
  }[];
  timeline: WindowPoint[];
}


/**
 * Maps attendance status to weighted numerical value.
 */
export function getStatusWeight(status: AttendanceStatusType): number {
  switch (status) {
    case 'PRESENT':
    case 'LATE':
      return 1.0;
    case 'HALF_DAY':
      return 0.5;
    case 'ABSENT':
    default:
      return 0.0;
  }
}

/**
 * Hand-written 2-Pointer Sliding Window & Streak Analyzer
 * Algorithm Complexity: O(N) Time, O(W) Space
 * Min Sample Guard: Requires at least `minSampleDays` (default 7) recorded days to activate percentage deficit alerts.
 */
export function analyzeStudentAttendance(
  studentId: string,
  records: RawAttendanceItem[],
  windowDays: number = 30,
  deficitThreshold: number = 75.0,
  minSampleDays: number = 7
): StudentSlidingWindowResult {
  const hasSufficientData = !!(records && records.length >= minSampleDays);
  const insufficientDataReason = !hasSufficientData
    ? `Only ${records?.length || 0} attendance record(s) logged. A minimum of ${minSampleDays} recorded days is required to calculate reliable rolling percentage deficits.`
    : undefined;

  if (!records || records.length === 0) {
    return {
      studentId,
      totalRecordsAnalyzed: 0,
      hasSufficientData: false,
      minSampleDays,
      insufficientDataReason: `No attendance records logged yet. Minimum ${minSampleDays} recorded days required.`,
      overallAttendanceRate: 100,
      lowestRolling30DayRate: 100,
      currentRolling30DayRate: 100,
      riskLevel: 'HEALTHY',
      streakInfo: { currentActiveStreak: 0, maxHistoricalStreak: 0, isStreakActive: false },
      stageAlerts: [],
      flaggedDeficitWindows: [],
      timeline: []
    };
  }


  // 1. Sort records chronologically by date
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Initialize streak tracking
  let currentStreak = 0;
  let maxStreak = 0;
  let lastAbsentDate: string | undefined = undefined;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!;
    if (item.status === 'ABSENT') {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      lastAbsentDate = new Date(item.date).toISOString().split('T')[0];
    } else {
      currentStreak = 0;
    }
  }

  const latestRecord = sorted[sorted.length - 1]!;
  const isStreakActive = latestRecord.status === 'ABSENT' && currentStreak >= 2;

  // 3. Two-Pointer Sliding Window Engine
  let left = 0;
  let runningWeightedSum = 0;
  let totalWeightedOverall = 0;
  const timeline: WindowPoint[] = [];
  const flaggedDeficitWindows: StudentSlidingWindowResult['flaggedDeficitWindows'] = [];
  let lowestRollingRate = 100;

  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  for (let right = 0; right < sorted.length; right++) {
    const currentItem = sorted[right]!;
    const currentDateMs = new Date(currentItem.date).getTime();
    const currentWeight = getStatusWeight(currentItem.status);

    runningWeightedSum += currentWeight;
    totalWeightedOverall += currentWeight;

    // Shrink window from the left if date gap exceeds windowDays
    while (left < right) {
      const leftDateMs = new Date(sorted[left]!.date).getTime();
      if (currentDateMs - leftDateMs > windowMs) {
        runningWeightedSum -= getStatusWeight(sorted[left]!.status);
        left++;
      } else {
        break;
      }
    }

    const windowSize = right - left + 1;
    const rollingRate = Math.round((runningWeightedSum / windowSize) * 1000) / 10; // Round to 1 decimal

    if (rollingRate < lowestRollingRate) {
      lowestRollingRate = rollingRate;
    }

    const isDeficit = hasSufficientData && rollingRate < deficitThreshold;

    const isoDateStr = new Date(currentItem.date).toISOString().split('T')[0]!;
    timeline.push({
      date: isoDateStr,
      status: currentItem.status,
      rollingRate,
      windowTotalDays: windowSize,
      windowPresentDays: runningWeightedSum,
      isDeficit
    });

    if (isDeficit) {
      const startDateStr = new Date(sorted[left]!.date).toISOString().split('T')[0]!;
      flaggedDeficitWindows.push({
        startDate: startDateStr,
        endDate: isoDateStr,
        rate: rollingRate,
        absentDays: windowSize - runningWeightedSum
      });
    }
  }

  const overallAttendanceRate = Math.round((totalWeightedOverall / sorted.length) * 1000) / 10;
  const currentRolling30DayRate = timeline.length > 0 ? timeline[timeline.length - 1]!.rollingRate : 100;

  // 4. Calculate Risk Level & Stage Alerts
  // Sample Size Guard: If total recorded days < minSampleDays, percentage deficit stage alerts are suppressed.
  // Consecutive absence streaks (>=3 or >=5 days) CAN still trigger stage alerts.
  let riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
  const stageAlerts: AttendanceStageAlert[] = [];
  const nowIso = new Date().toISOString();

  if (currentStreak >= 5) {
    riskLevel = 'CRITICAL';
    stageAlerts.push({
      alertId: `alert-${studentId}-stage3-${Date.now()}`,
      studentId,
      stage: 'STAGE_3_CRITICAL',
      severity: 'CRITICAL',
      title: 'Critical Consecutive Absentee Streak',
      message: `Student has accumulated a critical streak of ${currentStreak} consecutive unexcused absences!`,
      actionRequired: 'Immediate Class Teacher & Principal Call to Parent',
      triggeredAt: nowIso
    });
  } else if (hasSufficientData && currentRolling30DayRate < 60) {
    riskLevel = 'CRITICAL';
    stageAlerts.push({
      alertId: `alert-${studentId}-stage3-${Date.now()}`,
      studentId,
      stage: 'STAGE_3_CRITICAL',
      severity: 'CRITICAL',
      title: 'Critical Attendance Deficit Stage',
      message: `Student rolling 30-day attendance rate has dropped to ${currentRolling30DayRate}% (below 60%)!`,
      actionRequired: 'Immediate Class Teacher & Principal Call to Parent',
      triggeredAt: nowIso
    });
  } else if (currentStreak >= 3) {
    riskLevel = 'WARNING';
    stageAlerts.push({
      alertId: `alert-${studentId}-stage1-${Date.now()}`,
      studentId,
      stage: 'STAGE_1_STREAK',
      severity: 'HIGH',
      title: 'Active Absentee Streak Stage',
      message: `Student is currently on a ${currentStreak}-day consecutive absence streak!`,
      actionRequired: 'Class Teacher Check-in & Attendance Counseling',
      triggeredAt: nowIso
    });
  } else if (hasSufficientData && currentRolling30DayRate < deficitThreshold) {
    riskLevel = 'WARNING';
    stageAlerts.push({
      alertId: `alert-${studentId}-stage2-${Date.now()}`,
      studentId,
      stage: 'STAGE_2_WARNING',
      severity: 'MODERATE',
      title: 'Warning Attendance Deficit Stage',
      message: `Student rolling 30-day rate (${currentRolling30DayRate}%) is below target threshold (${deficitThreshold}%).`,
      actionRequired: 'Class Teacher Notice & Monitoring',
      triggeredAt: nowIso
    });
  }

  return {
    studentId,
    totalRecordsAnalyzed: sorted.length,
    hasSufficientData,
    minSampleDays,
    insufficientDataReason,
    overallAttendanceRate,
    lowestRolling30DayRate: lowestRollingRate,
    currentRolling30DayRate,
    riskLevel,
    streakInfo: {
      currentActiveStreak: currentStreak,
      maxHistoricalStreak: maxStreak,
      lastAbsentDate,
      isStreakActive
    },
    stageAlerts,
    flaggedDeficitWindows,
    timeline
  };
}

