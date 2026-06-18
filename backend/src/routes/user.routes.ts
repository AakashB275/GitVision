import {Router} from 'express'
import { requireAuthMiddleware } from '../middlewares/auth.middleware';
import {userController} from '../controllers/userController';


const userRouter = Router();

userRouter.get('/', requireAuthMiddleware, userController);

export default userRouter;