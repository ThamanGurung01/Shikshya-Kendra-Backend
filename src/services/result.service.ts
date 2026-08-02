import { Types } from 'mongoose';
import { ResultModel } from '../models/result.model';
import { GradeAssignment } from '../models/grade-assignment.model';
import { ExamModel } from '../models/exam.model';
import { AcademicYear } from '../models/academic-year.model';
import SubjectTeacherMapping from '../models/subject-teacher-mapping.model';
import { StudentEnrollment } from '../models/student-enrollment.model';
import { ICreateResultInput } from '../validators/result.validator';

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
  if (status === 'published') updateData.publishedAt = new Date();

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
