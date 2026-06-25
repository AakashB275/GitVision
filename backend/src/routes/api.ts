import express, {Request, Response, Router} from 'express';
import analysisRoutes from './analysis.routes';
import historyRouter from './history.routes';
import userRouter from './user.routes'
import savedRepoRouter from './savedRepo.routes'

const router: Router = express.Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/analyses', analysisRoutes);
router.use('/me', userRouter);
router.use('/save-repos', savedRepoRouter);
router.use('/history',historyRouter);

export default router;