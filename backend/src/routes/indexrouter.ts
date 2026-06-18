import express, { Request, Response, Router } from 'express';
import isLoggedIn from '../middlewares/isLoggedIn';

const router: Router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API of GitVision!' });
});

router.get('/home', isLoggedIn, (req: Request, res: Response) => {
  res.json({
    message: 'Home page',
    userId: (req as any).userId,
  });
});

export default router;