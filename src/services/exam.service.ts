import { ExamModel } from '../models/exam.model';
import { ExamRoutineModel } from '../models/exam-routine.model';
import { IExamInput, IExamRoutineInput } from '../validators/exam.validator';
import { AcademicYear } from '../models/academic-year.model';
import { SubjectModel } from '../models/subject.model';

export const createExam = async (data: IExamInput) => {
  // 1. Fetch active academic year
  const activeYear = await AcademicYear.findOne({ schoolId: data.schoolId, isCurrent: true }).lean();
  if (!activeYear) {
    throw new Error('No active academic year found for this school');
  }

  // 2. Create the Exam
  const exam = await ExamModel.create({
    ...data,
    academicYearId: activeYear._id,
    status: data.status || 'draft',
  });

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
      routinesToInsert.push({
        schoolId: data.schoolId,
        examId: (exam as any)._id,
        classId: classId,
        subjectId: (subjects[i] as any)._id,
        date: validDates[i],
        startTime: data.startTime,
        endTime: data.endTime,
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
        routinesToInsert.push({
          schoolId: data.schoolId,
          examId: (exam as any)._id,
          classId: classId,
          subjectId: (subjects[subjectIndex] as any)._id,
          date: validDates[dayIndex],
          startTime: data.startTime, // Initially give same default time
          endTime: data.endTime,     // Initially give same default time
          roomNumber: '',
        });
        subjectIndex++;
      }
    }
  }

  if (routinesToInsert.length > 0) {
    await ExamRoutineModel.insertMany(routinesToInsert);
  }

  return exam;
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

  return updated;
};

export const deleteExam = async (id: string, schoolId: string) => {
  // delete routines as well
  await ExamRoutineModel.deleteMany({ examId: id, schoolId });
  return await ExamModel.findOneAndDelete({ _id: id, schoolId });
};

export const getExamRoutine = async (examId: string, classId: string, schoolId: string) => {
  return await ExamRoutineModel.find({ examId, classId, schoolId }).populate('subjectId', 'name code').lean();
};

export const updateExamRoutine = async (id: string, schoolId: string, data: Partial<IExamRoutineInput>) => {
  return await ExamRoutineModel.findOneAndUpdate({ _id: id, schoolId }, data, { returnDocument: 'after' }).populate('subjectId', 'name code').lean();
};

export const createExamRoutineCell = async (data: IExamRoutineInput & { schoolId: string }) => {
  const payload = { ...data, roomNumber: data.roomNumber || '' };
  const newRoutine = await ExamRoutineModel.create(payload);
  return await ExamRoutineModel.findById((newRoutine as any)._id).populate('subjectId', 'name code').lean();
};

export const deleteExamRoutineCell = async (id: string, schoolId: string) => {
  return await ExamRoutineModel.findOneAndDelete({ _id: id, schoolId });
};
