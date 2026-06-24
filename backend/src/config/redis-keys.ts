export const REDIS_KEYS = {
  // Cache keys
  GRAPH_CACHE: (analysisId: string) => `graph:${analysisId}:data`,
  REPO_CACHE: (repoUrl: string) => `repo:${repoUrl}:metadata`,
  USER_REPOS: (userId: string) => `user:${userId}:repos`,
  ANALYSIS_METADATA: (analysisId: string) => `analysis:${analysisId}:meta`,

  // Session keys
  SSE_CLIENTS: (analysisId: string) => `sse:${analysisId}:clients`,
  ANALYSIS_PROGRESS: (analysisId: string) => `progress:${analysisId}`,

  // Temporary data
  GITHUB_WEBHOOK: (repoId: string) => `webhook:${repoId}:queue`,
  TEMP_ANALYSIS: (sessionId: string) => `temp:${sessionId}:analysis`,
} as const;

// TTL values in seconds
export const CACHE_TTL = {
  GRAPH: 3600, // 1 hour
  REPO_METADATA: 86400, // 24 hours
  ANALYSIS_METADATA: 3600,
  PROGRESS: 1800, // 30 minutes
  SESSION: 604800, // 7 days
} as const;