import db from '../db';

export const repoTreeCacheService = {
  async getCachedTree(commitSha: string): Promise<object | null> {
    const result = await db.query(
      `SELECT tree_json FROM cached_repo_trees
       WHERE commit_sha = $1 AND expires_at > now()`,
      [commitSha]
    );
    return result.rows[0]?.tree_json ?? null;
  },

  async setCachedTree(commitSha: string, treeJson: object): Promise<void> {
    await db.query(
      `INSERT INTO cached_repo_trees (commit_sha, tree_json)
       VALUES ($1, $2)
       ON CONFLICT (commit_sha) DO NOTHING`,
      [commitSha, JSON.stringify(treeJson)]
    );
  }
};