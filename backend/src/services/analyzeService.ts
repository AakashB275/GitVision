import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';
import simpleGit from 'simple-git';
import { cacheService } from './cacheService';
import { githubService } from './githubService';
import * as analysisModel from '../models/analysis.model';

interface AnalyzeInput {
  userId:    string;
  repoUrl:   string;
  repoOwner: string;
  repoName:  string;
}

export const analyzeService = {
  async analyze({ userId, repoUrl, repoOwner, repoName }: AnalyzeInput) {

    // 1. get latest commit SHA — this is our cache key
    const commitSha = await githubService.getLatestCommitSha(repoOwner, repoName);

    // 2. check cache — if hit, record history and return immediately
    const cached = await cacheService.getCachedGraph(commitSha);
    if (cached) {
      await analysisModel.insert({ userId, repoUrl, repoOwner, repoName, commitSha, status: 'done' });
      return cached;
    }

    // 3. cache miss — insert a pending record so history shows in-progress
    const analysis = await analysisModel.insert({
      userId, repoUrl, repoOwner, repoName, commitSha, status: 'pending'
    });

    // 4. clone, parse, cache — always clean up temp dir
    let tempDir: string | null = null;
    try {
      tempDir = await cloneRepo(repoUrl);
      const graph = await parseWithDependencyCruiser(tempDir);

      await cacheService.setCachedGraph(commitSha, graph);
      await analysisModel.updateStatus(analysis.id, 'done');

      return graph;

    } catch (err: any) {
      await analysisModel.updateStatus(analysis.id, 'failed', err?.message ?? 'Unknown error');
      throw err; // let error middleware handle the response

    } finally {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    }
  }
};

// ─── parser — dependency-cruiser ──────────────────────────────────────────────

async function parseWithDependencyCruiser(projectDir: string) {
  const { cruise } = await import('dependency-cruiser');
  const result = await cruise(
    [projectDir],
    {
      outputType: 'json',
      exclude: {
        path: 'node_modules|dist|build|\\.git|__pycache__',
      },
      doNotFollow: {
        path: 'node_modules',
      },
    },
  );

  const modules = (result.output as any).modules;
  return buildGraphJson(modules, projectDir);
}

function buildGraphJson(modules: any[], projectDir: string) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const cycleNodeIds = new Set<string>();

  for (const mod of modules) {
    const id = path.relative(projectDir, mod.source);

    nodes.push({
      id,
      label:       path.basename(mod.source, path.extname(mod.source)),
      language:    detectLanguage(mod.source),
      isExternal:  mod.followable === false,
      isCycleNode: false, // set below once we know all cycle members
    });

    for (const dep of mod.dependencies ?? []) {
      const targetId = path.relative(projectDir, dep.resolved);

      if (dep.circular) {
        cycleNodeIds.add(id);
        cycleNodeIds.add(targetId);
      }

      edges.push({
        source:     id,
        target:     targetId,
        isCircular: dep.circular ?? false,
      });
    }
  }

  for (const node of nodes) {
    if (cycleNodeIds.has(node.id)) node.isCycleNode = true;
  }

  return {
    meta: {
      parsedAt:  new Date().toISOString(),
      fileCount: nodes.filter(n => !n.isExternal).length,
    },
    nodes,
    edges,
    cycles: extractCycles(modules, projectDir),
  };
}

function extractCycles(modules: any[], projectDir: string): string[][] {
  const cycles: string[][] = [];
  const seen = new Set<string>();

  for (const mod of modules) {
    for (const dep of mod.dependencies ?? []) {
      if (dep.circular && dep.cycle) {
        const key = [...dep.cycle].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(dep.cycle.map((p: string) => path.relative(projectDir, p)));
        }
      }
    }
  }

  return cycles;
}

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath);
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescript',
    '.js': 'javascript', '.jsx': 'javascript',
    '.py': 'python', '.go': 'go',
  };
  return map[ext] ?? 'unknown';
}

interface GraphNode {
  id: string;
  label: string;
  language: string;
  isExternal: boolean;
  isCycleNode: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  isCircular: boolean;
}

// ─── clone ─────────────────────────────────────────────────────────────────────

async function cloneRepo(url: string): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `cdv-${uuid()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const clonePromise = simpleGit().clone(url, tempDir, [
    '--depth',         '1',
    '--single-branch',
    '--no-tags',
  ]);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Git clone timed out after 30s')), 30_000);
  });

  await Promise.race([clonePromise, timeoutPromise]);

  return tempDir;
}