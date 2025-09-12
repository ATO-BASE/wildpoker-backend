import { Router } from 'express';
import { register, verifyEmail, login, resendVerification } from '../controllers/auth.controller';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/login', login);
authRouter.post('/resend-verification', resendVerification);
