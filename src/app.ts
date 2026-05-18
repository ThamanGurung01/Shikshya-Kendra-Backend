import express from 'express';
import authRouter from './routes/auth.route';
import cookieParser from 'cookie-parser';
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './configs/swagger';
import schoolRouter from './routes/school.route';
import studentRouter from './routes/student.route';
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL??'http://localhost:3000',
  credentials: true,
}))
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/api-docs',swaggerUi.serve,swaggerUi.setup(swaggerDocs));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/school', schoolRouter);
app.use('/api/v1/student',studentRouter);
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
export default app;