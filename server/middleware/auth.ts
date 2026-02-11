import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DEFAULT_JWT_SECRET } from '../lib/constants';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
      req.userId = decoded.userId as string;
    }
    next();
  });
}
