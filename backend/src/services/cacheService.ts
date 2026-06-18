import db from '../db';

export const cacheService = {
  async getCachedGraph(commitSha: string): Promise<object | null> {
    const result = await db.query(
      `SELECT graph_json FROM cached_graphs
       WHERE commit_sha = $1 AND expires_at > now()`,
      [commitSha]
    );
    return result.rows[0]?.graph_json ?? null;
  },

  async setCachedGraph(commitSha: string, graphJson: object): Promise<void> {
    await db.query(
      `INSERT INTO cached_graphs (commit_sha, graph_json)
       VALUES ($1, $2)
       ON CONFLICT (commit_sha) DO NOTHING`,
      [commitSha, JSON.stringify(graphJson)]
    );
  }
};