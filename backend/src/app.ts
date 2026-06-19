import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import apiRouter from './routes/api';
import rateLimit from 'express-rate-limit';
import requestLogger from './middlewares/requestLogger';
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express';
import { errorMiddleware } from './middlewares/error.middleware';

const app: Express = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(clerkMiddleware());
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);


app.get('/protected', requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Use the `getUser()` method to get the user's User object
    const user = await clerkClient.users.getUser(userId);

    res.json({ user });
  } catch (error) {
    console.error('Error fetching protected route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log('Connect to NeonDB Postgres successfully');
  console.log(`Server is listening on Port ${PORT}`);
});