import { ExamModel } from '../models/exam.model';
import { ExamRoutineModel } from '../models/exam-routine.model';
import { IExamInput, IExamRoutineInput } from '../validators/exam.validator';
import { AcademicYear } from '../models/academic-year.model';
import { SubjectModel } from '../models/subject.model';
import { Student } from '../models/student.model';
import { Parent } from '../models/parent.model';
import { StudentEnrollment } from '../models/student-enrollment.model';

const updateActualEndDate = async (examId: string, schoolId: string) => {
  const lastRoutine = await ExamRoutineModel.findOne({ examId, schoolId }).sort({ date: -1 }).lean();
  const actualEndDate = lastRoutine ? lastRoutine.date : null;
  await ExamModel.updateOne({ _id: examId, schoolId }, { actualEndDate });
};

export const createExam = async (data: IExamInput) => {
  // 1. Fetch active academic year
  const activeYear = await AcademicYear.findOne({ schoolId: data.schoolId, isCurrent: true }).lean();
  if (!activeYear) {
    throw new Error('No active academic year found for this school');
  }

  const examPayload: any = {
    ...data,
    academicYearId: activeYear._id,
    status: data.status || 'draft',
  };
  if (examPayload.note === undefined) delete examPayload.note;
  if (examPayload.classTimes === undefined) delete examPayload.classTimes;

  const exam = await ExamModel.create(examPayload);

  // 3. Generate Routine
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const allowedDays = data.allowedDays.map(d => d.toLowerCase());
  
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Collect all valid dates between start and end
  const validDates: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayName = daysOfWeek[currentDate.getDay()] as string;
    if (allowedDays.includes(dayName)) {
      validDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const D = validDates.length;
  if (D === 0) {
    throw new Error('No valid days available for the exam in the given date range');
  }

  const routinesToInsert: any[] = [];

  // For each class, fetch subjects and distribute
  for (const classId of data.classes) {
    const subjects = await SubjectModel.find({ classId, schoolId: data.schoolId }).lean();
    const N = subjects.length;
    
    if (N === 0) continue; // no subjects for this class
    if (N > 2 * D) {
      throw new Error(`Cannot schedule ${N} subjects in ${D} days for class. Max 2 per day allowed.`);
    }

    // Pass 1: Assign 1 subject per day from day 1 to day D
    for (let i = 0; i < Math.min(N, D); i++) {
      const customTime = data.classTimes?.find(c => String(c.classId) === String(classId));
      routinesToInsert.push({
        schoolId: data.schoolId,
        examId: (exam as any)._id,
        classId: classId,
        subjectId: (subjects[i] as any)._id,
        date: validDates[i],
        startTime: customTime ? customTime.startTime : data.startTime,
        endTime: customTime ? customTime.endTime : data.endTime,
        roomNumber: '',
      });
    }

    // Pass 2: If remaining subjects, assign from last day backwards
    const remainingSubjects = N - D;
    if (remainingSubjects > 0) {
      let subjectIndex = D;
      for (let i = 0; i < remainingSubjects; i++) {
        // Start from last day backwards
        const dayIndex = D - 1 - i;
        const customTime = data.classTimes?.find(c => String(c.classId) === String(classId));
        routinesToInsert.push({
          schoolId: data.schoolId,
          examId: (exam as any)._id,
          classId: classId,
          subjectId: (subjects[subjectIndex] as any)._id,
          date: validDates[dayIndex],
          startTime: customTime ? customTime.startTime : data.startTime,
          endTime: customTime ? customTime.endTime : data.endTime,
          roomNumber: '',
        });
        subjectIndex++;
      }
    }
  }

  if (routinesToInsert.length > 0) {
    await ExamRoutineModel.insertMany(routinesToInsert);
  }
  
  await updateActualEndDate((exam as any)._id, data.schoolId);

  return await ExamModel.findById((exam as any)._id).lean();
};

export const getAllExams = async (schoolId: string) => {
  return await ExamModel.find({ schoolId }).sort({ createdAt: -1 }).populate('classes', 'name').populate('academicYearId', 'name').lean();
};

export const getExamById = async (id: string, schoolId: string) => {
  return await ExamModel.findOne({ _id: id, schoolId }).populate('classes', 'name').lean();
};

export const updateExam = async (id: string, schoolId: string, data: Partial<IExamInput>) => {
  const updated = await ExamModel.findOneAndUpdate({ _id: id, schoolId }, data, { returnDocument: 'after' }).lean();
  
  if (updated && (data.startDate || data.endDate)) {
    const start = new Date(updated.startDate as any);
    const end = new Date(updated.endDate as any);
    
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    await ExamRoutineModel.deleteMany({
      examId: id,
      schoolId,
      $or: [
        { date: { $lt: start } },
        { date: { $gt: end } }
      ]
    });
  }

  await updateActualEndDate(id, schoolId);
  return await ExamModel.findOne({ _id: id, schoolId }).lean();
};

export const deleteExam = async (id: string, schoolId: string) => {
  // delete routines as well
  await ExamRoutineModel.deleteMany({ examId: id, schoolId });
  return await ExamModel.findOneAndDelete({ _id: id, schoolId });
};

export const getExamRoutine = async (examId: string, classId: string | undefined, schoolId: string) => {
  const query: any = { examId, schoolId };
  if (classId) {
    query.classId = classId;
  }
  return await ExamRoutineModel.find(query).populate('subjectId', 'name code').lean();
};

export const updateExamRoutine = async (id: string, schoolId: string, data: Partial<IExamRoutineInput>) => {
  const updated = await ExamRoutineModel.findOneAndUpdate({ _id: id, schoolId }, data, { returnDocument: 'after' }).populate('subjectId', 'name code').lean();
  if (updated) await updateActualEndDate(updated.examId as any, schoolId);
  return updated;
};

export const createExamRoutineCell = async (data: IExamRoutineInput & { schoolId: string }) => {
  const payload = { ...data, roomNumber: data.roomNumber || '' };
  const newRoutine = await ExamRoutineModel.create(payload);
  await updateActualEndDate(data.examId as any, data.schoolId);
  return await ExamRoutineModel.findById((newRoutine as any)._id).populate('subjectId', 'name code').lean();
};

export const deleteExamRoutineCell = async (id: string, schoolId: string) => {
  const deleted = await ExamRoutineModel.findOneAndDelete({ _id: id, schoolId });
  if (deleted) await updateActualEndDate(deleted.examId as any, schoolId);
  return deleted;
};

export const getMyExams = async (schoolId: string, role: string, userId: string, studentId?: string) => {
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
  if (!activeYear) throw new Error('No active academic year');

  let classIds: string[] | null = null; // null means all classes

  if (role === 'student') {
    const student = await Student.findOne({ userId, schoolId }).lean();
    if (!student) throw new Error('Student not found');
    const enrollment = await StudentEnrollment.findOne({ studentId: student._id, academicYearId: activeYear._id }).lean();
    if (!enrollment) throw new Error('No active enrollment');
    classIds = [String(enrollment.classId)];
  } else if (role === 'parent') {
    const parent = await Parent.findOne({ userId }).lean();
    if (!parent) throw new Error('Parent not found');
    let studentQuery: any = { parentId: parent._id, schoolId };
    if (studentId) {
      studentQuery._id = studentId;
    }
    const students = await Student.find(studentQuery).lean();
    const studentIds = students.map(s => s._id);
    const enrollments = await StudentEnrollment.find({ studentId: { $in: studentIds }, academicYearId: activeYear._id }).lean();
    classIds = enrollments.map(e => String(e.classId));
  }

  // Find upcoming and active exams
  const query: any = { schoolId, academicYearId: activeYear._id, status: { $in: ['upcoming', 'active'] } };
  if (classIds) {
    query.classes = { $in: classIds };
  }

  const exams = await ExamModel.find(query).populate('classes', 'name').lean();

  // sort nearest upcoming first (based on startDate)
  exams.sort((a, b) => {
    const dateA = new Date(a.startDate as any).getTime();
    const dateB = new Date(b.startDate as any).getTime();
    return dateA - dateB;
  });

  return exams;
};

export const getMyExamRoutine = async (examId: string, schoolId: string, role: string, userId: string, studentId?: string) => {
  const activeYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).lean();
  if (!activeYear) throw new Error('No active academic year');

  let classIds: string[] | null = null; // null means all classes

  if (role === 'student') {
    const student = await Student.findOne({ userId, schoolId }).lean();
    if (!student) throw new Error('Student not found');
    const enrollment = await StudentEnrollment.findOne({ studentId: student._id, academicYearId: activeYear._id }).lean();
    if (!enrollment) throw new Error('No active enrollment');
    classIds = [String(enrollment.classId)];
  } else if (role === 'parent') {
    const parent = await Parent.findOne({ userId }).lean();
    if (!parent) throw new Error('Parent not found');
    let studentQuery: any = { parentId: parent._id, schoolId };
    if (studentId) {
      studentQuery._id = studentId;
    }
    const students = await Student.find(studentQuery).lean();
    const studentIds = students.map(s => s._id);
    const enrollments = await StudentEnrollment.find({ studentId: { $in: studentIds }, academicYearId: activeYear._id }).lean();
    classIds = enrollments.map(e => String(e.classId));
  }

  const exam = await ExamModel.findOne({ _id: examId, schoolId }).populate('classes', 'name').lean();
  if (!exam) throw new Error('Exam not found');

  // Verify the user's class is part of this exam
  if (classIds) {
    const hasAccess = (exam.classes as any[]).some(c => classIds!.includes(String(c._id)));
    if (!hasAccess) throw new Error('Unauthorized: Your class is not part of this exam');
  }

  const query: any = { examId, schoolId };


  const routine = await ExamRoutineModel.find(query).populate('subjectId', 'name code').lean();

  return { exam, routine };
};
