import express from 'express';
import authRouter from './routes/auth.route';
import cookieParser from 'cookie-parser';
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './configs/swagger';
import schoolRouter from './routes/school.route';
import studentRouter from './routes/student.route';
import parentRouter from './routes/parent.route';
import academicYearRouter from './routes/academic-year.route';
import classRouter from './routes/class.route';
import sectionRouter from './routes/section.route';
import subjectRouter from './routes/subject.route';
import teacherRouter from './routes/teacher.route';
import librarianRouter from './routes/librarian.route';
import accountantRouter from './routes/accountant.route';
import adminRouter from './routes/admin.route';
import routineRouter from './routes/routine.route';
import examRouter from './routes/exam.route';
import fileRouter from './routes/file.route';
import announcementRouter from './routes/announcement.route';
import calendarEventRouter from './routes/calendar-event.route';
import mailRouter from './routes/mail.route';
import assignmentRouter from './routes/assignment.route';
import bookRouter from './routes/book.route';
import libraryRouter from './routes/library.route';
import attendanceRouter from './routes/attendance.route';
import { errorHandler } from './utils/error.util';
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL??'http://localhost:3000',
  credentials: true,
}))
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerDocs, {
  swaggerOptions: {
    tagsSorter: (leftTag: string, rightTag: string) => {
      const tagOrder: Record<string, number> = {
        Auth: 0,
        School: 1,
        Student: 2,
        'Academic Year': 3,
        Class: 4,
        Section: 5,
        Subject: 6,
        Teacher: 7,
        Admin: 8,
        Librarian: 9,
        Accountant: 10,
        Book: 11,
      };

      return (tagOrder[leftTag] ?? Number.MAX_SAFE_INTEGER) - (tagOrder[rightTag] ?? Number.MAX_SAFE_INTEGER);
    },
  },
}));
app.use('/api/v1', fileRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/school', schoolRouter);
app.use('/api/v1/student',studentRouter);
app.use('/api/v1/parent',parentRouter);
app.use('/api/v1/academic-year',academicYearRouter);
app.use('/api/v1/class', classRouter);
app.use('/api/v1/section', sectionRouter);
app.use('/api/v1/subject', subjectRouter);
app.use('/api/v1/teacher', teacherRouter);
app.use('/api/v1/librarian', librarianRouter);
app.use('/api/v1/accountant', accountantRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/routine', routineRouter);
app.use('/api/v1/exam', examRouter);
app.use('/api/v1/announcements', announcementRouter);
app.use('/api/v1/calendar', calendarEventRouter);
app.use('/api/v1/mail', mailRouter);
app.use('/api/v1/assignments', assignmentRouter);
app.use('/api/v1/book', bookRouter);
app.use('/api/v1/library', libraryRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.get('/', (req, res) => {
  res.send('Hello, World222!');
});

app.use(errorHandler);

export default app;