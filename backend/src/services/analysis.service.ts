//for BullMQ usage
import { analyzeService } from './analyzeService';

/**
 * The graph shape returned by analyzeService.analyze() and expected by the
 * frontend / Redis cache layer.
 */
interface GraphData {
  meta: { parsedAt: string; fileCount: number };
  nodes: Array<{
    id: string;
    label: string;
    language: string;
    isExternal: boolean;
    isCycleNode: boolean;
  }>;
  edges: Array<{
    source: string;
    target: string;
    isCircular: boolean;
  }>;
  cycles: string[][];
}

export async function analyzeRepository(
  analysisId: string,
  userId: string,
  repoUrl: string,
  branch: string,
  onProgress: (stage: string, progress: number, message: string) => Promise<void>
): Promise<GraphData> {

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  const [, owner, repo] = match;

  // analyzeService does the single DB insert (with real commit_sha) and all updates
  const result = await analyzeService.analyze({
    analysisId,
    userId,
    repoUrl,
    repoOwner: owner,
    repoName: repo,
    onProgress,
  });

  return result as GraphData;
}