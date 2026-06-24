import { Router, Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { requireAuthMiddleware } from '../middlewares/auth.middleware';
import  db  from '../db';
import { createAnalysisJob, getJobStatus } from '../jobs/analysis.jobs';
import SSEService from '../services/sseSevice';
import CacheService from '../services/redisCacheService';
import { REDIS_KEYS } from '../config/redis-keys';

const analysisRouter = Router();

/**
 * POST /api/analyses
 * Create new analysis and queue job
 */
analysisRouter.post('/', requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { repositoryUrl, branch } = req.body;
    const userId = getAuth(req).userId!;

    // Validate input
    if (!repositoryUrl) {
      return res.status(400).json({ error: 'Repository URL required' });
    }

    // Extract owner/repo from URL
    const match = repositoryUrl.match(
      /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
    );
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    const repoOwner = match[1];
    const repoName = match[2].replace(/\.git$/, '');

    // Create analysis record (columns must match the analyses table schema)
    const result = await db.query(
      `INSERT INTO analyses (user_id, repo_url, repo_owner, repo_name, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, status, created_at`,
      [userId, repositoryUrl, repoOwner, repoName, 'queued']
    );

    const analysisId = result.rows[0].id;

    // Queue the job
    const job = await createAnalysisJob(
      analysisId,
      repositoryUrl,
      userId,
      branch
    );

    // Invalidate user's analyses cache
    await CacheService.invalidate(REDIS_KEYS.USER_REPOS(userId));

    res.json({
      id: analysisId,
      status: 'queued',
      message: 'Analysis queued for processing',
      jobId: job.id,
    });
  } catch (err) {
    console.error('Error creating analysis:', err);
    res.status(500).json({ error: 'Failed to create analysis' });
  }
});

/**
 * GET /api/analyses/:analysisId
 * Get analysis with cache
 */
analysisRouter.get('/:analysisId', requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const analysisId = req.params.analysisId as string;

    // Get with cache fallback
    const data = await CacheService.getGraphData(analysisId);

    if (!data) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching analysis:', err);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

/**
 * GET /api/analyses/:analysisId/progress
 * Get current progress
 */
analysisRouter.get(
  '/:analysisId/progress',
  requireAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const analysisId = req.params.analysisId as string;
      const progress = await SSEService.getProgress(analysisId);

      res.json(progress || { status: 'unknown', progress: 0 });
    } catch (err) {
      console.error('Error fetching progress:', err);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  }
);

/**
 * GET /api/analyses/:analysisId/stream
 * SSE endpoint for real-time progress
 * Supports auth via query param `token` since EventSource can't set headers.
 */
analysisRouter.get(
  '/:analysisId/stream',
  async (req: Request, res: Response, next) => {
    // EventSource can't send Authorization headers, so accept token as query param
    const token = req.query.token as string | undefined;
    if (token && !req.headers.authorization) {
      req.headers.authorization = `Bearer ${token}`;
    }
    next();
  },
  requireAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const analysisId = req.params.analysisId as string;
      const auth = getAuth(req);
      const userId = auth.userId!;

      // Setup SSE connection
      await SSEService.setupSSE(res, analysisId, userId);
    } catch (err) {
      console.error('Error setting up SSE:', err);
      res.status(500).json({ error: 'Failed to setup stream' });
    }
  }
);

/**
 * GET /api/analyses
 * List user's analyses with cache
 */
analysisRouter.get('/', requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = getAuth(req).userId!;

    const analyses = await CacheService.getUserAnalyses(userId);

    res.json(analyses);
  } catch (err) {
    console.error('Error listing analyses:', err);
    res.status(500).json({ error: 'Failed to list analyses' });
  }
});

export default analysisRouter;