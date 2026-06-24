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

async function parseWithDependencyCruiser(projectDir: string) {
  const { cruise } = await import('dependency-cruiser')

  // On Windows, path.join(baseDir, absolutePath) duplicates the path when both
  // are absolute — pass '.' relative to baseDir, not the absolute projectDir.
  const result = await cruise(
    ['.'],
    {
      baseDir: projectDir,
      exclude: {
        path: 'node_modules|dist|build|\\.git|__pycache__',
      },
      doNotFollow: {
        path: 'node_modules',
      },
    },
  )

  const output = result.output as { modules: any[]; summary: any }
  const modules = output.modules

  if (!Array.isArray(modules)) {
    throw new Error(`modules is not iterable, got: ${typeof modules}`)
  }

  return buildGraphJson(modules, projectDir)
}

function buildGraphJson(modules: any[], projectDir: string) {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const cycleNodeIds = new Set<string>()

  // normalize once
  const base = projectDir.replace(/\\/g, '/').replace(/\/?$/, '/')

  function toRelative(absPath: string): string {
    const normalized = absPath.replace(/\\/g, '/')
    return normalized.startsWith(base)
      ? normalized.slice(base.length)
      : normalized   // already relative, or external
  }

  for (const mod of modules) {
    const id = toRelative(mod.source)

    nodes.push({
      id,
      label:       path.basename(mod.source, path.extname(mod.source)),
      language:    detectLanguage(mod.source),
      isExternal:  mod.followable === false,
      isCycleNode: false,
    })

    for (const dep of mod.dependencies ?? []) {
      const targetId = toRelative(dep.resolved)

      if (dep.circular) {
        cycleNodeIds.add(id)
        cycleNodeIds.add(targetId)
      }

      edges.push({
        source:     id,
        target:     targetId,
        isCircular: dep.circular ?? false,
      })
    }
  }

  for (const node of nodes) {
    if (cycleNodeIds.has(node.id)) node.isCycleNode = true
  }

  return {
    meta: {
      parsedAt:  new Date().toISOString(),
      fileCount: nodes.filter(n => !n.isExternal).length,
    },
    nodes,
    edges,
    cycles: extractCycles(modules, base),
  }
}

function extractCycles(modules: any[], base: string): string[][] {
  const cycles: string[][] = []
  const seen = new Set<string>()

  for (const mod of modules) {
    for (const dep of mod.dependencies ?? []) {
      if (dep.circular && dep.cycle) {
        const key = [...dep.cycle].sort().join('|')
        if (!seen.has(key)) {
          seen.add(key)
          cycles.push(
            dep.cycle.map((p: string) => {
              const normalized = p.replace(/\\/g, '/')
              return normalized.startsWith(base)
                ? normalized.slice(base.length)
                : normalized
            })
          )
        }
      }
    }
  }

  return cycles
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
  // Use os.tmpdir() directly without path.join with __dirname
  const tempDir = path.join(os.tmpdir(), `cdv-${uuid()}`)  // ← this is fine
  await fs.mkdir(tempDir, { recursive: true })

  const clonePromise = simpleGit().clone(url, tempDir, [
    '--depth',         '1',
    '--single-branch',
    '--no-tags',
  ])

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Git clone timed out after 30s')), 30_000)
  })

  await Promise.race([clonePromise, timeoutPromise])

  return tempDir
}

