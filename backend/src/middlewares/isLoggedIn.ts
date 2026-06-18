import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';


export default async function isLoggedIn(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized. Please log in.' });
      return;
    }

    // Attach userId to request for use in route handlers
    (req as any).userId = userId;

    next();
  } catch (error) {
    console.error('Error in isLoggedIn middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
