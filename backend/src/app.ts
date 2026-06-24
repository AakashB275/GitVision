import dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import apiRouter from './routes/api';
import rateLimit from 'express-rate-limit';
import requestLogger from './middlewares/requestLogger';
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express';
import { errorMiddleware } from './middlewares/error.middleware';
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { analysisQueue, analysisWorker, analysisQueueEvents } from './jobs/analysis.jobs';
import analysisRoutes from './routes/analysis.routes';
import redis from './config/redis';

dotenv.config();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const app: Express = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(cors());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(clerkMiddleware());
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
});
app.use(limiter);


app.get('/protected', requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await clerkClient.users.getUser(userId);

    res.json({ user });
  } catch (error) {
    console.error('Error fetching protected route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api', apiRouter);

app.get('/health', async(req: Request, res: Response) => {
  const redisOk = await redis.ping().then(() => true).catch(() => false);
  
  res.json({
    status: redisOk ? 'healthy' : 'degraded',
    redis: redisOk,
    timestamp: new Date().toISOString(),
  });
});

// Queue stats
app.get('/api/queue/stats', async (req, res) => {
  const counts = await analysisQueue.getJobCounts();
  const workers = await analysisQueue.getWorkers();

  res.json({
    jobCounts: counts,
    activeWorkers: workers.length,
    concurrency: 3,
  });
});

app.use(errorMiddleware);

// async function cleanOrphanedClones() {
//   const tmpDir = os.tmpdir()
//   const entries = await fs.readdir(tmpDir)
//   const stale = entries.filter(e => e.startsWith('cdv-'))
//   await Promise.all(
//     stale.map(e => fs.rm(path.join(tmpDir, e), { recursive: true, force: true }))
//   )
//   if (stale.length > 0) {
//     console.log(`[startup] cleaned ${stale.length} orphaned clone(s)`)
//   }
// }

// await cleanOrphanedClones()

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await analysisWorker.close();
  await analysisQueue.close();
  await redis.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log('Connect to NeonDB Postgres successfully');
  console.log(`Server is listening on Port ${PORT}`);
  console.log(`BullMQ worker started`);
  console.log(`Redis connected`);
});