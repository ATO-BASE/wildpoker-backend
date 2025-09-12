import { Request, Response, NextFunction } from 'express';
import { User } from "../models";
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';

export interface AuthRequest extends Request {
  user?:User& { id: number; role: 'player' | 'admin' | 'staff' };
}
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No tokenen' });
    return;
  }

  try {
    req.user = jwt.verify(token, config.JWT_SECRET) as any;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
