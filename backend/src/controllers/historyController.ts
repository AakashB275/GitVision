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

export async function deleteHistoryController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req);
  const { id } = req.params;
  const analysisId = Array.isArray(id) ? id[0] : id;

  const user = await userService.getOrCreateUser(clerkId!);

  const removed = await analysisModel.deleteByUserAndId(user.id, analysisId);

  if (!removed) {
    return res.status(404).json({ error: 'Analysis not found', code: 'NOT_FOUND' });
  }

  return res.status(200).json({ success: true });
}