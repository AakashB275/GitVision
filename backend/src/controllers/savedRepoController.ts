import { Request, Response } from 'express';
import { getAuth }            from '@clerk/express';
import { savedRepoService }   from '../services/savedRepoService';
import { userService }        from '../services/userService';
import { parseGithubUrl } from '../middlewares/validate.middleware';

export async function listSavedReposController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req);
  const user = await userService.getOrCreateUser(clerkId!);

  const savedRepos = await savedRepoService.list(user.id);

  return res.status(200).json(savedRepos);
}

export async function saveRepoController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req);
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required', code: 'MISSING_URL' });
  }

  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid GitHub URL', code: 'INVALID_URL' });
  }

  const user = await userService.getOrCreateUser(clerkId!);

  const saved = await savedRepoService.save({
    userId:    user.id,
    repoUrl:   url,
    repoOwner: parsed.owner,
    repoName:  parsed.repo,
  });

  return res.status(201).json(saved);
}

export async function removeSavedRepoController(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req);
  const { id } = req.params;
  const savedRepoId = Array.isArray(id) ? id[0] : id;

  const user = await userService.getOrCreateUser(clerkId!);

  const removed = await savedRepoService.remove(user.id, savedRepoId);

  if (!removed) {
    return res.status(404).json({ error: 'Saved repo not found', code: 'NOT_FOUND' });
  }

  return res.status(200).json({ success: true });
}