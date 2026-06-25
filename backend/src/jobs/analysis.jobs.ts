import { Queue, Worker, QueueEvents } from 'bullmq';
import redis from '../config/redis';
import { analyzeRepository } from '../services/analysis.service';
import { REDIS_KEYS, CACHE_TTL } from '../config/redis-keys';

interface AnalysisJobData {
  analysisId: string;
  repoUrl: string;
  userId: string;
  branch?: string;
}

interface AnalysisProgress {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stage: string;
  progress: number; // 0-100
  message: string;
  timestamp: number;
  error?: string;
}

export const analysisQueue = new Queue<AnalysisJobData>('repository-analysis', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1 hour
    },
    removeOnFail: {
      age: 86400, // 24 hours
    },
  },
});

// Queue Events for monitoring
export const analysisQueueEvents = new QueueEvents('repository-analysis', {
  connection: redis as any,
});

// Worker that processes jobs
export const analysisWorker = new Worker<AnalysisJobData>(
  'repository-analysis',
  async (job) => {
    const analysisId = job.data.analysisId;
    const progressKey = REDIS_KEYS.ANALYSIS_PROGRESS(analysisId);

    try {
      // Update progress: queued -> processing
      await redis.setex(
        progressKey,
        CACHE_TTL.PROGRESS,
        JSON.stringify({
          status: 'processing',
          stage: 'initializing',
          progress: 5,
          message: 'Starting analysis...',
          timestamp: Date.now(),
        } as AnalysisProgress)
      );

      // Publish to SSE clients
      await redis.publish(
        `analysis:${analysisId}:updates`,
        JSON.stringify({
          type: 'progress',
          stage: 'initializing',
          progress: 5,
          message: 'Starting analysis...',
        })
      );

      // Run analysis with progress callback
      const result = await analyzeRepository(
        analysisId,
        job.data.userId,
        job.data.repoUrl,
        job.data.branch || 'master',
        async (stage: string, progress: number, message: string) => {
          const progressData: AnalysisProgress = {
            status: 'processing',
            stage,
            progress,
            message,
            timestamp: Date.now(),
          };

          // Update Redis with progress
          await redis.setex(
            progressKey,
            CACHE_TTL.PROGRESS,
            JSON.stringify(progressData)
          );

          // Publish SSE update
          await redis.publish(
            `analysis:${analysisId}:updates`,
            JSON.stringify({
              type: 'progress',
              stage,
              progress,
              message,
            })
          );

          // Update job progress for BullMQ dashboard
          await job.updateProgress(progress);
        }
      );

      // Cache the result
      await redis.setex(
        REDIS_KEYS.GRAPH_CACHE(analysisId),
        CACHE_TTL.GRAPH,
        JSON.stringify(result)
      );

      // Final progress update
      const finalProgress: AnalysisProgress = {
        status: 'completed',
        stage: 'completed',
        progress: 100,
        message: 'Analysis completed successfully',
        timestamp: Date.now(),
      };

      await redis.setex(
        progressKey,
        CACHE_TTL.PROGRESS,
        JSON.stringify(finalProgress)
      );

      // Publish completion
      await redis.publish(
        `analysis:${analysisId}:updates`,
        JSON.stringify({
          type: 'completed',
          stage: 'completed',
          progress: 100,
          message: 'Analysis completed successfully',
          data: result,
        })
      );

      return result;
    } catch (error) {
      const errorProgress: AnalysisProgress = {
        status: 'failed',
        stage: 'error',
        progress: 0,
        message: 'Analysis failed',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await redis.setex(
        progressKey,
        CACHE_TTL.PROGRESS,
        JSON.stringify(errorProgress)
      );

      await redis.publish(
        `analysis:${analysisId}:updates`,
        JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );

      throw error;
    }
  },
  {
    connection: redis as any,
    concurrency: 3, // Process 3 jobs in parallel
  }
);

// Job events
analysisWorker.on('completed', (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

analysisWorker.on('failed', (job, err) => {
  console.error(`✗ Job ${job?.id} failed:`, err);
});

// Add job to queue
export async function createAnalysisJob(
  analysisId: string,
  repoUrl: string,
  userId: string,
  branch?: string
) {
  const job = await analysisQueue.add(
    'analyze-repo',
    {
      analysisId,
      repoUrl,
      userId,
      branch,
    },
    {
      jobId: analysisId,
      priority: 5,
    }
  );

  return job;
}

// Get job status
export async function getJobStatus(jobId: string) {
  const job = await analysisQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress;
  const attempts = job.attemptsMade;
  const maxAttempts = job.opts.attempts;

  return {
    jobId,
    state,
    progress,
    attempts,
    maxAttempts,
    data: job.data,
  };
}

export default analysisQueue;