import { Router } from 'express';
import { historyController } from '../controllers/historyController';
import { getAnalysisController } from '../controllers/getAnalysisController';
import { requireAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuthMiddleware, historyController);
router.get('/:id', requireAuthMiddleware, getAnalysisController);

export default router;