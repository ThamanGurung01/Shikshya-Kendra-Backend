import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import app from './app';
import { connectDB } from './configs/db';
import { initSocketServer } from './configs/socket';

const requiredEnv = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'MONGO_URI'];
// use this command "cp .env.example .env"
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined in environment variables`);
  }
}

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully!');
    const httpServer = createServer(app);
    initSocketServer(httpServer);
    httpServer.listen(PORT, () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Server running on [http://localhost:${PORT}]`);
      } else {
        console.log(`Server running on port ${PORT}`);
      }
    });
  } catch (error) {
    console.error('Server Start Error:', error);
  }
};

startServer();
