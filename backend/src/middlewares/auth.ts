import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};

export const requireOwnData = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const { userId } = req.params;

  if (!user || user.id !== Number(userId)) {
    res.status(403).json({ error: 'Forbidden: Cannot access others’ data' });
    return;
  }

  next();
};