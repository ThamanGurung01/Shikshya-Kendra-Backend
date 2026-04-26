import express from 'express';
import { authRouter } from './routes/auth';
import cookieParser from 'cookie-parser';
import cors from "cors";
const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL??'http://localhost:3000',
  credentials: true,
}))
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRouter);
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
export default app;