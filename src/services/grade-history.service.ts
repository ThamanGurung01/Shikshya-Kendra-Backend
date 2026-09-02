import { GradeHistory } from '../models/grade-history.model';

export const getStudentHistory = async (
  studentId: string,
  schoolId: string,
  filters?: { resultId?: string; examId?: string },
) => {
  const query: any = { studentId, schoolId };
  if (filters?.resultId) query.resultId = filters.resultId;
  if (filters?.examId) query.examId = filters.examId;

  // Return latest version per subject per result (max version per gradeAssignmentId)
  const history = await GradeHistory.find(query)
    .populate('resultId', 'name status')
    .populate('examId', 'name startDate endDate gradingSystem')
    .populate('subjectId', 'name code')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .sort({ 'examId.startDate': -1, version: -1 })
    .lean();

  // Deduplicate — keep latest version per gradeAssignmentId
  const seen = new Map<string, typeof history[0]>();
  for (const h of history) {
    const key = String(h.gradeAssignmentId);
    if (!seen.has(key)) seen.set(key, h);
  }

  return Array.from(seen.values());
};

export const getResultHistory = async (resultId: string, schoolId: string) => {
  // Get the max version for each gradeAssignmentId for this result
  const allHistory = await GradeHistory.find({ resultId, schoolId })
    .populate('studentId', 'studentName student_email')
    .populate('subjectId', 'name code')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('teacherId', 'teacherName')
    .sort({ version: -1 })
    .lean();

  // Deduplicate — keep latest version per gradeAssignmentId per student
  const seen = new Map<string, typeof allHistory[0]>();
  for (const h of allHistory) {
    const studentIdStr = typeof h.studentId === 'object' && h.studentId !== null && '_id' in h.studentId 
      ? String((h.studentId as any)._id) 
      : String(h.studentId);
    const key = `${String(h.gradeAssignmentId)}_${studentIdStr}`;
    if (!seen.has(key)) seen.set(key, h);
  }

  return Array.from(seen.values());
};

export const getSubjectHistory = async (gradeAssignmentId: string, schoolId: string) => {
  return await GradeHistory.find({ gradeAssignmentId, schoolId })
    .populate('studentId', 'studentName student_email')
    .sort({ version: 1 })
    .lean();
};
