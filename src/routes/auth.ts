import {Router} from 'express';
import { login, refreshToken, logout } from '../controllers/authController';
export const authRouter=Router();

authRouter.post('/login',login);
authRouter.post('/refresh-token',refreshToken);
authRouter.post('/logout',logout);
