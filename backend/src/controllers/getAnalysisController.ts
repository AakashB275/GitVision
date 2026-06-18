import { Request, Response } from 'express';
import { getAuth }            from '@clerk/express';
import { userService }        from '../services/userService';
import * as analysisModel     from '../models/analysis.model';

export async function getAnalysisController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req);
  const { id } = req.params;
  const analysisId = Array.isArray(id) ? id[0] : id;

  const user = await userService.getOrCreateUser(clerkId!);

  const analysis = await analysisModel.findById(analysisId);

  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found', code: 'NOT_FOUND' });
  }

  if (analysis.user_id !== user.id) {
    return res.status(404).json({ error: 'Analysis not found', code: 'NOT_FOUND' });
    // returning 404 instead of 403 here is deliberate — it avoids confirming
    // to an attacker that the ID exists but belongs to someone else
  }

  return res.status(200).json(analysis);
}