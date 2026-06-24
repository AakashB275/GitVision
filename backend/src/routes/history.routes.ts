import { Router } from 'express';
import { historyController, deleteHistoryController } from '../controllers/historyController';
import { getAnalysisController } from '../controllers/getAnalysisController';
import { requireAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuthMiddleware, historyController);
router.get('/:id', requireAuthMiddleware, getAnalysisController);
router.delete('/:id', requireAuthMiddleware, deleteHistoryController);

export default router;