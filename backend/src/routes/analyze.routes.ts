import { Router } from 'express';
import { analyzeController } from '../controllers/analyzeController';
import { requireAuthMiddleware } from '../middlewares/auth.middleware';
import { validateGithubUrl } from '../middlewares/validate.middleware';
const analyzeRouter = Router();

analyzeRouter.post('/', requireAuthMiddleware, validateGithubUrl, analyzeController);

export default analyzeRouter;

