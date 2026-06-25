import redis from '../config/redis';
import { REDIS_KEYS, CACHE_TTL } from '../config/redis-keys';
import db from '../db'; 

export class CacheService {
  
  static async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      // Try cache first
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      console.warn('Cache read error:', err);
    }

    // Fetch from database
    const data = await fetcher();

    // Store in cache
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (err) {
      console.warn('Cache write error:', err);
    }

    return data;
  }

  
  static async getGraphData(analysisId: string) {
    return this.getOrFetch(
      REDIS_KEYS.GRAPH_CACHE(analysisId),
      async () => {
        // The cached_graphs table is keyed by commit_sha, so join through
        // the analyses table to look up the graph for this analysis.
        const result = await db.query(
          `SELECT cg.graph_json
           FROM analyses a
           JOIN cached_graphs cg ON cg.commit_sha = a.commit_sha
           WHERE a.id = $1`,
          [analysisId]
        );
        return result.rows[0]?.graph_json ?? null;
      },
      CACHE_TTL.GRAPH
    );
  }

 
  static async getRepoMetadata(repoUrl: string) {
    return this.getOrFetch(
      REDIS_KEYS.REPO_CACHE(repoUrl),
      async () => {
        const result = await db.query(
          `SELECT * FROM saved_repos WHERE url = $1 LIMIT 1`,
          [repoUrl]
        );
        return result.rows[0] || null;
      },
      CACHE_TTL.REPO_METADATA
    );
  }


  static async getUserAnalyses(userId: string) {
    return this.getOrFetch(
      REDIS_KEYS.USER_REPOS(userId),
      async () => {
        const result = await db.query(
          `SELECT id, repo_url, created_at, status 
           FROM analyses 
           WHERE user_id = $1 
           ORDER BY created_at DESC`,
          [userId]
        );
        return result.rows;
      },
      CACHE_TTL.ANALYSIS_METADATA
    );
  }

  static async invalidate(key: string) {
    await redis.del(key);
  }


  static async invalidatePattern(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  static async cacheAnalysisResult(analysisId: string, data: any) {
    await redis.setex(
      REDIS_KEYS.GRAPH_CACHE(analysisId),
      CACHE_TTL.GRAPH,
      JSON.stringify(data)
    );
  }


  static async batchSet(entries: Array<[key: string, value: any, ttl: number]>) {
    const pipe = redis.pipeline();
    for (const [key, value, ttl] of entries) {
      pipe.setex(key, ttl, JSON.stringify(value));
    }
    await pipe.exec();
  }


  static async getStats() {
    const info = await redis.info('stats');
    const keys = await redis.dbsize();
    return {
      info,
      totalKeys: keys,
    };
  }
}

export default CacheService;