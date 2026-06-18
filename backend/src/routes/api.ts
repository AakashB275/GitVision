import express, { Request, Response, Router } from 'express';
import analyzeRouter from './analyze.routes';
import historyRouter from './history.routes';
import userRouter from './user.routes'
import savedRepoRouter from './savedRepo.routes'
// import eventsRouter from './events.routes';

const router: Router = express.Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/analyze', analyzeRouter);
router.use('/me', userRouter);
router.use('/save-repos', savedRepoRouter);
router.use('/history',historyRouter);

export default router;