import { Request, Response, NextFunction } from 'express';

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(\.git)?\/?$/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export async function validateGithubUrl(req: Request, res: Response, next: NextFunction) {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required', code: 'MISSING_URL' });
  }

  const parsed = parseGithubUrl(url);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid GitHub URL', code: 'INVALID_URL' });
  }

  // check repo size via GitHub API before cloning
  try {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    );

    if (response.status === 404) {
      return res.status(404).json({ error: 'Repo not found or is private', code: 'REPO_NOT_FOUND' });
    }
    if (!response.ok) {
      return res.status(502).json({ error: 'GitHub API error', code: 'GITHUB_API_ERROR' });
    }

    const meta = (await response.json()) as { size: number };

    // meta.size is in KB
    if (meta.size > 50_000) {
      return res.status(400).json({
        error: `Repo is too large (${Math.round(meta.size / 1024)}MB). Max is 50MB.`,
        code: 'REPO_TOO_LARGE'
      });
    }

    // attach parsed info to req so controller doesn't re-parse
    res.locals.repoOwner = parsed.owner;
    res.locals.repoName  = parsed.repo;
    res.locals.repoMeta  = meta;

    next();
  } catch {
    return res.status(502).json({ error: 'Failed to reach GitHub API', code: 'GITHUB_UNREACHABLE' });
  }
}