import express from 'express';
import authRouter from './routes/auth.route';
import cookieParser from 'cookie-parser';
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './configs/swagger';
import schoolRouter from './routes/school.route';
import studentRouter from './routes/student.route';
import academicYearRouter from './routes/academic-year.route';

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
      };

      return (tagOrder[leftTag] ?? Number.MAX_SAFE_INTEGER) - (tagOrder[rightTag] ?? Number.MAX_SAFE_INTEGER);
    },
  },
}));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/school', schoolRouter);
app.use('/api/v1/student',studentRouter);
app.use('/api/v1/academic-year',academicYearRouter);
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
export default app;