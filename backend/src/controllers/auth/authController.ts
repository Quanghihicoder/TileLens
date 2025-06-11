import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserByUsername, findUserByUserId, createUser } from '../../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3d';

const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: 'Missing username field' });
    return; 
  }

  let user = await findUserByUsername(username);

  // If user doesn't exist, create a new one
  if (!user) {
    user = await createUser(username);
  }

  const token = generateToken(user.id);

  // Store in httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    sameSite: 'strict',
  });

  res.json({ message: 'Authenticated', user: { id: user.id, username: user.username } });
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({ message: 'Logged out successfully' });
};

export const currentUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    if (!decoded.id) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Fetch user from DB using userId
    const user = await findUserByUserId(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({ user: { id: user.id, username: user.username } });
    return; 
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
    return; 
  }
};
