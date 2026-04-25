import express from 'express';
import { authRouter } from './routes/auth';
import cookieParser from 'cookie-parser';
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRouter);
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
export default app;