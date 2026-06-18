import { Request, Response } from 'express';
import { getAuth }            from '@clerk/express';
import { userService }        from '../services/userService';
import * as analysisModel     from '../models/analysis.model';

export async function historyController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req);

  const user = await userService.getOrCreateUser(clerkId!);

  const analyses = await analysisModel.findByUser(user.id);

  return res.status(200).json(analyses);
}