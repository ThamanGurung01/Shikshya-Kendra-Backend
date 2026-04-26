import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import {connectDB} from './configs/db';
const requiredEnv = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'MONGO_URI'];
//check for env  
// use this coommand "cp .env.example .env"
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined in environment variables`);
  }
}
const PORT = process.env.PORT || 3000;
const startServer=async()=>{
try {
  await connectDB();
  app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
} catch (error) {
  console.error('Server Start Error:', error);
}
}
startServer();