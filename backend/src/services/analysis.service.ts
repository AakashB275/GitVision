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
  repoUrl: string,
  branch: string,
  onProgress: (stage: string, progress: number, message: string) => Promise<void>
): Promise<GraphData> {
  
  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  const [, owner, repo] = match;
  
  await onProgress('fetching', 5, 'Starting analysis...');
  
  // Call your existing analyzeService with progress callback.
  // analyzeService.analyze() already returns the full GraphData shape
  // ({ meta, nodes, edges, cycles }) — just pass it through.
  const result = await analyzeService.analyze({
    userId: 'system',
    repoUrl,
    repoOwner: owner,
    repoName: repo,
    onProgress,
  });
  
  await onProgress('completed', 100, 'Analysis complete');
  
  return result as GraphData;
}