import { Types } from 'mongoose';
import { GradeAssignment, IGradeEntry } from '../models/grade-assignment.model';
import { GradeHistory } from '../models/grade-history.model';
import { ExamModel } from '../models/exam.model';
import { Teacher } from '../models/teacher.model';
import { ResultModel } from '../models/result.model';
import { IUpdateGradeEntriesInput } from '../validators/grade-assignment.validator';

export const getMyGradeAssignments = async (userId: string, schoolId: string) => {
  // Resolve teacher from userId
  const teacher = await Teacher.findOne({ userId: new Types.ObjectId(userId), schoolId }).lean();
  if (!teacher) throw new Error('Teacher not found');

  return await GradeAssignment.find({ teacherId: teacher._id, schoolId })
    .populate('resultId', 'name status')
    .populate('examId', 'name startDate endDate')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .select('-entries')
    .sort({ createdAt: -1 })
    .lean()
    .then((assignments) =>
      assignments.map((a) => ({
        ...a,
        studentCount: 0, // entries not loaded for list view
      })),
    );
};

export const getMyGradeAssignmentDetail = async (id: string, userId: string, schoolId: string) => {
  const teacher = await Teacher.findOne({ userId: new Types.ObjectId(userId), schoolId }).lean();
  if (!teacher) throw new Error('Teacher not found');

  const assignment = await GradeAssignment.findOne({ _id: id, teacherId: teacher._id, schoolId })
    .populate('resultId', 'name status')
    .populate('examId', 'name startDate endDate gradingSystem examConfiguration')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('entries.studentId', 'studentName student_email documents')
    .lean();

  if (!assignment) throw new Error('Grade assignment not found or access denied');

  const mappedEntries = assignment.entries.map((entry: any) => {
    const student = entry.studentId;
    return {
      ...entry,
      studentId: student ? {
        _id: student._id,
        name: student.studentName,
        email: student.student_email,
        profileImage: student.documents?.photoUrl || null,
      } : null
    };
  });

  return { ...assignment, entries: mappedEntries };
};

export const getAdminGradeAssignmentDetail = async (id: string, schoolId: string) => {
  const assignment = await GradeAssignment.findOne({ _id: id, schoolId })
    .populate('resultId', 'name status')
    .populate('examId', 'name startDate endDate gradingSystem examConfiguration')
    .populate('teacherId', 'teacherName teacher_email')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('entries.studentId', 'studentName student_email documents')
    .lean();

  if (!assignment) throw new Error('Grade assignment not found');

  const mappedEntries = assignment.entries.map((entry: any) => {
    const student = entry.studentId;
    return {
      ...entry,
      studentId: student ? {
        _id: student._id,
        name: student.studentName,
        email: student.student_email,
        profileImage: student.documents?.photoUrl || null,
      } : null
    };
  });

  return { ...assignment, entries: mappedEntries };
};

export const updateGradeEntries = async (
  id: string,
  userId: string,
  schoolId: string,
  data: IUpdateGradeEntriesInput,
) => {
  const teacher = await Teacher.findOne({ userId: new Types.ObjectId(userId), schoolId }).lean();
  if (!teacher) throw new Error('Teacher not found');

  const assignment = await GradeAssignment.findOne({ _id: id, teacherId: teacher._id, schoolId });
  if (!assignment) throw new Error('Grade assignment not found or access denied');
  if (assignment.status === 'finalized') throw new Error('Cannot edit a finalized grade assignment. Ask admin to reopen it.');

  // Update entries — merge incoming data with existing entries
  const updatedEntries: IGradeEntry[] = assignment.entries.map((entry) => {
    const incoming = data.entries.find((e) => String(e.studentId) === String(entry.studentId));
    if (!incoming) return entry;

    const theoryMarks = incoming.isAbsent ? null : (incoming.theoryMarks ?? null);
    const practicalMarks = incoming.isAbsent ? null : (incoming.practicalMarks ?? null);
    const totalMarks =
      theoryMarks !== null && practicalMarks !== null
        ? theoryMarks + practicalMarks
        : theoryMarks !== null
          ? theoryMarks
          : null;

    const updatedEntry: IGradeEntry = {
      studentId: entry.studentId,
      enrollmentId: entry.enrollmentId,
      theoryMarks: theoryMarks,
      practicalMarks: practicalMarks,
      totalMarks: totalMarks,
      isAbsent: incoming.isAbsent,
      remarks: incoming.remarks ?? entry.remarks ?? null,
    };
    return updatedEntry;
  });

  assignment.entries = updatedEntries;
  assignment.status = 'draft';
  await assignment.save();

  return assignment;
};

export const finalizeGradeAssignment = async (id: string, userId: string, schoolId: string) => {
  const teacher = await Teacher.findOne({ userId: new Types.ObjectId(userId), schoolId }).lean();
  if (!teacher) throw new Error('Teacher not found');

  const assignment = await GradeAssignment.findOne({ _id: id, teacherId: teacher._id, schoolId })
    .populate('examId')
    .lean();
  if (!assignment) throw new Error('Grade assignment not found or access denied');
  if (assignment.status === 'finalized') throw new Error('Grade assignment is already finalized');

  // Validate: every student must have marks or be marked absent
  const incomplete = assignment.entries.filter(
    (e) => !e.isAbsent && e.theoryMarks === null && e.practicalMarks === null,
  );
  if (incomplete.length > 0) {
    throw new Error(
      `${incomplete.length} student(s) still have no marks entered. Please fill in marks or mark them absent.`,
    );
  }

  // Get exam configuration for full marks
  const exam = assignment.examId as any;
  const examConfig = exam?.examConfiguration?.find(
    (c: any) => String(c.classId) === String(assignment.classId),
  );
  const subjectConfig = examConfig?.subjects?.find(
    (s: any) => String(s.subjectId) === String(assignment.subjectId),
  );
  const theoryFullMarks = subjectConfig?.theoryFullMarks ?? 0;
  const practicalFullMarks = subjectConfig?.practicalFullMarks ?? 0;

  // Determine next version
  const lastHistory = await GradeHistory.findOne({ gradeAssignmentId: id }).sort({ version: -1 }).lean();
  const nextVersion = lastHistory ? lastHistory.version + 1 : 1;

  const gradedAt = new Date();

  // Bulk-insert GradeHistory — one per student
  const historyDocs = assignment.entries.map((entry) => ({
    schoolId: assignment.schoolId,
    resultId: assignment.resultId,
    gradeAssignmentId: assignment._id,
    examId: assignment.examId,
    studentId: entry.studentId,
    enrollmentId: entry.enrollmentId,
    classId: assignment.classId,
    sectionId: assignment.sectionId,
    subjectId: assignment.subjectId,
    teacherId: teacher._id,
    theoryMarks: entry.theoryMarks ?? null,
    practicalMarks: entry.practicalMarks ?? null,
    totalMarks: entry.totalMarks ?? null,
    theoryFullMarks,
    practicalFullMarks,
    isAbsent: entry.isAbsent,
    remarks: entry.remarks ?? null,
    version: nextVersion,
    gradedAt,
  }));

  await GradeHistory.insertMany(historyDocs);

  // Update assignment status
  return await GradeAssignment.findByIdAndUpdate(
    id,
    { status: 'finalized', finalizedAt: gradedAt },
    { returnDocument: 'after' },
  ).lean();
};

export const reopenGradeAssignment = async (id: string, schoolId: string) => {
  const assignment = await GradeAssignment.findOne({ _id: id, schoolId }).lean();
  if (!assignment) throw new Error('Grade assignment not found');
  if (assignment.status !== 'finalized') throw new Error('Grade assignment is not finalized');

  return await GradeAssignment.findByIdAndUpdate(
    id,
    { status: 'draft', finalizedAt: null },
    { returnDocument: 'after' },
  ).lean();
};

export const getAssignmentHistory = async (gradeAssignmentId: string, schoolId: string) => {
  return await GradeHistory.find({ gradeAssignmentId, schoolId })
    .populate('studentId', 'name email')
    .populate('subjectId', 'name code')
    .sort({ version: 1, 'studentId.name': 1 })
    .lean();
};

export const reassignGradeAssignmentTeacher = async (
  id: string,
  teacherId: string,
  schoolId: string,
) => {
  const assignment = await GradeAssignment.findOne({ _id: id, schoolId });
  if (!assignment) throw new Error('Grade assignment not found');

  // Check if result is published
  const result = await ResultModel.findById(assignment.resultId).lean();
  if (result && result.status === 'published') {
    throw new Error('Cannot reassign teacher for a published result');
  }

  // Verify that the new teacher exists and belongs to the same school
  const teacher = await Teacher.findOne({ _id: new Types.ObjectId(teacherId), schoolId }).lean();
  if (!teacher) throw new Error('New teacher not found');

  // Update teacherId in GradeAssignment
  const updatedAssignment = await GradeAssignment.findByIdAndUpdate(
    id,
    { teacherId: new Types.ObjectId(teacherId) },
    { returnDocument: 'after' }
  )
    .populate('resultId', 'name status')
    .populate('examId', 'name startDate endDate')
    .populate('teacherId', 'teacherName teacher_email')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .lean();

  // Also update teacherId in all GradeHistory entries for this assignment (if any)
  await GradeHistory.updateMany(
    { gradeAssignmentId: id, schoolId },
    { teacherId: new Types.ObjectId(teacherId) }
  );

  return updatedAssignment;
};
