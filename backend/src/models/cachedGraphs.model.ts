import db from '../db';

export async function findByCommitSha(commitSha: string) {
  const result = await db.query(
    `SELECT graph_json FROM cached_graphs
     WHERE commit_sha = $1 AND expires_at > now()`,
    [commitSha]
  );
  return result.rows[0]?.graph_json ?? null;
}

export async function insert(commitSha: string, graphJson: object) {
  const result = await db.query(
    `INSERT INTO cached_graphs (commit_sha, graph_json)
     VALUES ($1, $2)
     ON CONFLICT (commit_sha) DO NOTHING
     RETURNING *`,
    [commitSha, JSON.stringify(graphJson)]
  );
  return result.rows[0] ?? null; 
}

export async function deleteExpired() {
  const result = await db.query(
    `DELETE FROM cached_graphs WHERE expires_at < now() RETURNING commit_sha`
  );
  return result.rowCount; 
}