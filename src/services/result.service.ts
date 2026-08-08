import { Types } from 'mongoose';
import { ResultModel } from '../models/result.model';
import { GradeAssignment } from '../models/grade-assignment.model';
import { ExamModel } from '../models/exam.model';
import { AcademicYear } from '../models/academic-year.model';
import SubjectTeacherMapping from '../models/subject-teacher-mapping.model';
import { StudentEnrollment } from '../models/student-enrollment.model';
import { ICreateResultInput } from '../validators/result.validator';
import { Student } from '../models/student.model';
import { Parent } from '../models/parent.model';
import { calculateWlmScores, IWlmBreakdown } from './wlm.service';

export const createResult = async (data: ICreateResultInput, createdBy: string) => {
  // 1. Get active academic year
  const activeYear = await AcademicYear.findOne({ schoolId: data.schoolId, isCurrent: true }).lean();
  if (!activeYear) throw new Error('No active academic year found for this school');

  // 2. Get exam
  const exam = await ExamModel.findOne({ _id: data.examId, schoolId: data.schoolId }).lean();
  if (!exam) throw new Error('Exam not found');

  // 3. Check result doesn't already exist for this exam
  const existing = await ResultModel.findOne({ schoolId: data.schoolId, examId: data.examId }).lean();
  if (existing) throw new Error('A result already exists for this exam');

  // 4. Create the Result document
  const result = await ResultModel.create({
    schoolId: data.schoolId,
    academicYearId: activeYear._id,
    examId: data.examId,
    name: data.name,
    classIds: data.classIds.map((id) => new Types.ObjectId(id)),
    status: 'processing',
    createdBy: new Types.ObjectId(createdBy),
  });

  // 5. Auto-create GradeAssignments per teacher × subject × section
  const gradeAssignmentsToInsert: any[] = [];

  for (const classId of data.classIds) {
    // Get all subject-teacher mappings for this class
    // We need all sections for this class
    const mappings = await SubjectTeacherMapping.find({
      schoolId: data.schoolId,
      classId: new Types.ObjectId(classId),
    }).lean();

    // Group by sectionId
    const sectionMap = new Map<string, typeof mappings>();
    for (const mapping of mappings) {
      const secKey = String(mapping.sectionId);
      if (!sectionMap.has(secKey)) sectionMap.set(secKey, []);
      sectionMap.get(secKey)!.push(mapping);
    }

    for (const [sectionId, sectionMappings] of sectionMap.entries()) {
      // Get enrolled students for this class+section
      const enrollments = await StudentEnrollment.find({
        schoolId: data.schoolId,
        classId: new Types.ObjectId(classId),
        sectionId: new Types.ObjectId(sectionId),
        academicYearId: activeYear._id,
        studentEnrollmentStatus: 'active',
      })
        .sort({ rollNumber: 1 })
        .lean();

      // Build grade entries for each student
      const entries = enrollments.map((enrollment) => ({
        studentId: enrollment.studentId,
        enrollmentId: enrollment._id,
        theoryMarks: null,
        practicalMarks: null,
        totalMarks: null,
        isAbsent: false,
        remarks: null,
      }));

      // Create one GradeAssignment per subject-teacher mapping
      for (const mapping of sectionMappings) {
        gradeAssignmentsToInsert.push({
          schoolId: data.schoolId,
          resultId: result._id,
          examId: data.examId,
          teacherId: mapping.teacherId,
          classId: new Types.ObjectId(classId),
          sectionId: mapping.sectionId,
          subjectId: mapping.subjectId,
          status: 'pending',
          entries: [...entries],
        });
      }
    }
  }

  if (gradeAssignmentsToInsert.length > 0) {
    await GradeAssignment.insertMany(gradeAssignmentsToInsert);
  }

  return await ResultModel.findById(result._id)
    .populate('examId', 'name startDate endDate status')
    .populate('classIds', 'name')
    .lean();
};

export const getAllResults = async (schoolId: string) => {
  return await ResultModel.find({ schoolId })
    .populate('examId', 'name startDate endDate status gradingSystem')
    .populate('classIds', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

export const getResultById = async (id: string, schoolId: string) => {
  const result = await ResultModel.findOne({ _id: id, schoolId })
    .populate('examId', 'name startDate endDate status gradingSystem examConfiguration')
    .populate('classIds', 'name')
    .populate('wlmScores.studentId', 'studentName admissionNumber')
    .lean();
  if (!result) return null;

  // Aggregate grade assignment progress
  const total = await GradeAssignment.countDocuments({ resultId: id, schoolId });
  const finalized = await GradeAssignment.countDocuments({ resultId: id, schoolId, status: 'finalized' });

  return { ...result, progress: { total, finalized, allFinalized: total > 0 && total === finalized } };
};

export const updateResultStatus = async (id: string, schoolId: string, status: string) => {
  const result = await ResultModel.findOne({ _id: id, schoolId }).lean();
  if (!result) throw new Error('Result not found');

  // Guard: only publish when all GradeAssignments are finalized
  if (status === 'published') {
    const total = await GradeAssignment.countDocuments({ resultId: id, schoolId });
    const finalized = await GradeAssignment.countDocuments({ resultId: id, schoolId, status: 'finalized' });
    if (total === 0 || total !== finalized) {
      throw new Error(`Cannot publish: ${finalized}/${total} grade assignments finalized`);
    }
  }

  const updateData: any = { status };

  if (status === 'published') {
    // Calculate WLM scores for all class+section combos
    const exam = await ExamModel.findById(result.examId).lean();
    const allWlmScores: IWlmBreakdown[] = [];

    for (const classId of result.classIds) {
      const sectionIds = await GradeAssignment.distinct('sectionId', { resultId: id, classId });
      for (const sectionId of sectionIds) {
        const scores = await calculateWlmScores(
          id, schoolId, String(result.academicYearId),
          String(classId), String(sectionId), exam!.endDate,
        );
        allWlmScores.push(...scores);
      }
    }

    updateData.wlmScores = allWlmScores;
    updateData.publishedAt = new Date();
  }

  // Clear WLM scores when re-opening a published result
  if (result.status === 'published' && status !== 'published') {
    updateData.wlmScores = [];
  }

  return await ResultModel.findOneAndUpdate({ _id: id, schoolId }, updateData, { returnDocument: 'after' })
    .populate('examId', 'name startDate endDate status')
    .populate('classIds', 'name')
    .lean();
};

export const deleteResult = async (id: string, schoolId: string) => {
  const result = await ResultModel.findOne({ _id: id, schoolId }).lean();
  if (!result) throw new Error('Result not found');
  if (result.status === 'published') throw new Error('Cannot delete a published result');

  await GradeAssignment.deleteMany({ resultId: id, schoolId });
  return await ResultModel.findOneAndDelete({ _id: id, schoolId });
};

export const getResultGradeAssignments = async (resultId: string, schoolId: string) => {
  return await GradeAssignment.find({ resultId, schoolId })
    .populate('teacherId', 'teacherName teacher_email')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .select('-entries')
    .lean();
};

export const getMyResults = async (
  schoolId: string,
  role: string,
  userId: string,
  studentId?: string,
) => {
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
  if (!activeYear) throw new Error('No active academic year found');

  let classId: string | null = null;
  let targetStudentId: string | null = null;

  if (role === 'student') {
    const student = await Student.findOne({ userId, schoolId }).lean();
    if (!student) throw new Error('Student not found');
    targetStudentId = String(student._id);
    const enrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      academicYearId: activeYear._id,
    }).lean();
    if (!enrollment) throw new Error('No active enrollment found for student');
    classId = String(enrollment.classId);
  } else if (role === 'parent') {
    const parent = await Parent.findOne({ userId }).lean();
    if (!parent) throw new Error('Parent not found');
    
    if (!studentId) {
      return [];
    }

    const student = await Student.findOne({ _id: studentId, parentId: parent._id, schoolId }).lean();
    if (!student) throw new Error('Student not found or not associated with this parent');
    targetStudentId = String(student._id);

    const enrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      academicYearId: activeYear._id,
    }).lean();
    if (!enrollment) throw new Error('No active enrollment found for student');
    classId = String(enrollment.classId);
  }

  if (!classId) return [];

  // Get all published results that contain the student's class
  const results = await ResultModel.find({
    schoolId,
    academicYearId: activeYear._id,
    status: 'published',
    classIds: new Types.ObjectId(classId),
  })
    .populate('examId', 'name startDate endDate gradingSystem')
    .populate('classIds', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return results.map(r => ({
    ...r,
    studentId: targetStudentId,
  }));
};

import * as GradeHistoryService from './grade-history.service';

export const getMyResultDetails = async (
  resultId: string,
  schoolId: string,
  role: string,
  userId: string,
  studentId?: string,
) => {
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
  if (!activeYear) throw new Error('No active academic year found');

  // Verify that the result is published and exists in the school
  const result = await ResultModel.findOne({ _id: resultId, schoolId, status: 'published' })
    .populate('examId', 'name startDate endDate gradingSystem examConfiguration')
    .populate('classIds', 'name')
    .lean();
  if (!result) throw new Error('Result not found or not published');

  let targetStudentId: string | null = null;
  let targetEnrollment: any = null;

  if (role === 'student') {
    const student = await Student.findOne({ userId, schoolId }).lean();
    if (!student) throw new Error('Student not found');
    targetStudentId = String(student._id);
    targetEnrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      academicYearId: activeYear._id,
    })
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .lean();
  } else if (role === 'parent') {
    const parent = await Parent.findOne({ userId }).lean();
    if (!parent) throw new Error('Parent not found');

    if (!studentId) {
      throw new Error('Student ID is required for parent role');
    }

    const student = await Student.findOne({ _id: studentId, parentId: parent._id, schoolId }).lean();
    if (!student) throw new Error('Student not found or not associated with this parent');
    targetStudentId = String(student._id);

    targetEnrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      academicYearId: activeYear._id,
    })
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .lean();
  }

  if (!targetStudentId || !targetEnrollment) throw new Error('Student enrollment details not found');

  // Make sure the result includes the student's class
  const studentClassId = String(targetEnrollment.classId?._id || targetEnrollment.classId);
  const classInResult = result.classIds.some(
    (c: any) => String(c._id || c) === studentClassId
  );
  if (!classInResult) throw new Error('Access denied: Student class not included in this result');

  // Get grade history for this student & result
  const grades = await GradeHistoryService.getStudentHistory(targetStudentId, schoolId, { resultId });

  // Get the student basic details too
  const studentDetails = await Student.findById(targetStudentId)
    .populate('userId', 'name profileImage')
    .lean();

  return {
    result,
    student: {
      _id: targetStudentId,
      studentName: studentDetails?.studentName || '',
      admissionNumber: studentDetails?.admissionNumber || '',
      rollNumber: targetEnrollment.rollNumber || null,
      className: targetEnrollment.classId?.name || '',
      sectionName: targetEnrollment.sectionId?.name || '',
      classId: targetEnrollment.classId?._id?.toString() || String(targetEnrollment.classId),
      sectionId: targetEnrollment.sectionId?._id?.toString() || String(targetEnrollment.sectionId),
      photo: (studentDetails as any)?.userId?.profileImage || null,
    },
    grades,
    // WLM data for Performance Overview (radar chart + comparison bars)
    wlm: getWlmDataForStudent(result, targetStudentId),
  };
};

/**
 * Extract WLM data for a single student from the result's stored snapshot.
 * Computes class averages from all stored scores (zero extra DB queries).
 */
function getWlmDataForStudent(result: any, studentId: string) {
  if (!result.wlmScores || result.wlmScores.length === 0) return null;

  const studentWlm = result.wlmScores.find(
    (s: any) => String(s.studentId) === studentId
  );
  if (!studentWlm) return null;

  // Compute class averages from the stored snapshot
  const scores = result.wlmScores;
  const avg = (arr: number[]) => arr.length > 0
    ? Math.round(arr.reduce((a: number, b: number) => a + b, 0) / arr.length * 100) / 100
    : 0;

  const classAverage = {
    examScore: avg(scores.map((s: any) => s.examScore)),
    attendanceScore: avg(scores.map((s: any) => s.attendanceScore)),
    assignmentScore: avg(scores.map((s: any) => s.assignmentScore)),
    comprehensiveScore: avg(scores.map((s: any) => s.comprehensiveScore)),
  };

  return {
    student: {
      examScore: studentWlm.examScore,
      attendanceScore: studentWlm.attendanceScore,
      assignmentScore: studentWlm.assignmentScore,
      comprehensiveScore: studentWlm.comprehensiveScore,
    },
    classAverage,
  };
}

export const getStudentResultsForAdmin = async (schoolId: string, studentId: string) => {
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
  if (!activeYear) throw new Error('No active academic year found');

  const student = await Student.findOne({ _id: studentId, schoolId }).lean();
  if (!student) throw new Error('Student not found');

  const enrollment = await StudentEnrollment.findOne({
    studentId: student._id,
    academicYearId: activeYear._id,
  }).lean();
  if (!enrollment) throw new Error('No active enrollment found for student');
  const classId = String(enrollment.classId);

  // Get all published results that contain the student's class
  const results = await ResultModel.find({
    schoolId,
    academicYearId: activeYear._id,
    status: 'published',
    classIds: new Types.ObjectId(classId),
  })
    .populate('examId', 'name startDate endDate gradingSystem')
    .populate('classIds', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return results.map(r => ({
    ...r,
    studentId: String(student._id),
  }));
};

export const getStudentResultDetailsForAdmin = async (
  resultId: string,
  schoolId: string,
  studentId: string,
) => {
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
  if (!activeYear) throw new Error('No active academic year found');

  const result = await ResultModel.findOne({ _id: resultId, schoolId, status: 'published' })
    .populate('examId', 'name startDate endDate gradingSystem examConfiguration')
    .populate('classIds', 'name')
    .lean();
  if (!result) throw new Error('Result not found or not published');

  const student = await Student.findOne({ _id: studentId, schoolId }).lean();
  if (!student) throw new Error('Student not found');

  const targetEnrollment = await StudentEnrollment.findOne({
    studentId: student._id,
    academicYearId: activeYear._id,
  })
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .lean();
  if (!targetEnrollment) throw new Error('Student enrollment details not found');

  const studentClassId = String(targetEnrollment.classId?._id || targetEnrollment.classId);
  const classInResult = result.classIds.some(
    (c: any) => String(c._id || c) === studentClassId
  );
  if (!classInResult) throw new Error('Access denied: Student class not included in this result');

  const grades = await GradeHistoryService.getStudentHistory(String(student._id), schoolId, { resultId });

  const studentDetails = await Student.findById(student._id)
    .populate('userId', 'name profileImage')
    .lean();

  return {
    result,
    student: {
      _id: String(student._id),
      studentName: studentDetails?.studentName || '',
      admissionNumber: studentDetails?.admissionNumber || '',
      rollNumber: targetEnrollment.rollNumber || null,
      className: (targetEnrollment.classId as any)?.name || '',
      sectionName: (targetEnrollment.sectionId as any)?.name || '',
      classId: (targetEnrollment.classId as any)?._id?.toString() || String(targetEnrollment.classId),
      sectionId: (targetEnrollment.sectionId as any)?._id?.toString() || String(targetEnrollment.sectionId),
      photo: (studentDetails as any)?.userId?.profileImage || null,
    },
    grades,
    wlm: getWlmDataForStudent(result, String(student._id)),
  };
};

