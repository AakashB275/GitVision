
import { Router } from 'express';
import {
  listSavedReposController,
  saveRepoController,
  removeSavedRepoController,
} from '../controllers/savedRepoController';
import { requireAuthMiddleware } from '../middlewares/auth.middleware';

const savedRepoRouter = Router();

savedRepoRouter.get('/',    requireAuthMiddleware, listSavedReposController);
savedRepoRouter.post('/',   requireAuthMiddleware, saveRepoController);
savedRepoRouter.delete('/:id', requireAuthMiddleware, removeSavedRepoController);

export default savedRepoRouter;