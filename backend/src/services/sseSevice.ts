import { Response } from 'express';
import redis from '../config/redis';
import { REDIS_KEYS } from '../config/redis-keys';

interface SSEClient {
  analysisId: string;
  userId: string;
  res: Response;
  createdAt: number;
}

// In-memory client tracking (backup for reconnects)
const activeClients = new Map<string, SSEClient>();

export class SSEService {
  /**
   * Setup SSE connection
   */
  static async setupSSE(
    res: Response,
    analysisId: string,
    userId: string
  ): Promise<void> {
    // HTTP headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });

    // Track client
    const clientId = `${userId}-${Date.now()}`;
    activeClients.set(clientId, {
      analysisId,
      userId,
      res,
      createdAt: Date.now(),
    });

    // Add to Redis set for this analysis
    await redis.sadd(REDIS_KEYS.SSE_CLIENTS(analysisId), clientId);

    // Subscribe to progress updates
    const pubsub = redis.duplicate();
    pubsub.subscribe(`analysis:${analysisId}:updates`, (err, count) => {
      if (err) {
        console.error('Failed to subscribe:', err);
        return;
      }
      console.log(`✓ SSE client subscribed to analysis:${analysisId}`);
    });

    // Handle incoming messages
    pubsub.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });

    // Handle client disconnect
    res.on('close', async () => {
      console.log(`✗ SSE client disconnected: ${clientId}`);
      activeClients.delete(clientId);
      await redis.srem(REDIS_KEYS.SSE_CLIENTS(analysisId), clientId);
      pubsub.disconnect();
    });

    res.on('error', async (err) => {
      console.error('SSE error:', err);
      activeClients.delete(clientId);
      await redis.srem(REDIS_KEYS.SSE_CLIENTS(analysisId), clientId);
      pubsub.disconnect();
    });

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to analysis stream',
        timestamp: Date.now(),
      })}\n\n`
    );
  }

  /**
   * Get current analysis progress
   */
  static async getProgress(analysisId: string) {
    const progressData = await redis.get(
      REDIS_KEYS.ANALYSIS_PROGRESS(analysisId)
    );
    return progressData ? JSON.parse(progressData) : null;
  }

  /**
   * Broadcast message to all clients for an analysis
   */
  static async broadcastProgress(analysisId: string, data: any) {
    await redis.publish(
      `analysis:${analysisId}:updates`,
      JSON.stringify(data)
    );
  }

  /**
   * Get active client count for an analysis
   */
  static async getActiveClientCount(analysisId: string): Promise<number> {
    return await redis.scard(REDIS_KEYS.SSE_CLIENTS(analysisId));
  }

  /**
   * Cleanup disconnected clients (periodic)
   */
  static async cleanupStaleClients() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [clientId, client] of activeClients.entries()) {
      if (now - client.createdAt > maxAge) {
        console.log(`Cleaning up stale client: ${clientId}`);
        activeClients.delete(clientId);
        await redis.srem(
          REDIS_KEYS.SSE_CLIENTS(client.analysisId),
          clientId
        );
      }
    }
  }
}

// Periodic cleanup
setInterval(() => {
  SSEService.cleanupStaleClients();
}, 5 * 60 * 1000); // Every 5 minutes

export default SSEService;