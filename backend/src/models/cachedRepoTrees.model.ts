import db from '../db';

export async function findByCommitSha(commitSha: string) {
  const result = await db.query(
    `SELECT tree_json FROM cached_repo_trees
     WHERE commit_sha = $1 AND expires_at > now()`,
    [commitSha]
  );
  return result.rows[0]?.tree_json ?? null;
}

export async function insert(commitSha: string, treeJson: object) {
  const result = await db.query(
    `INSERT INTO cached_repo_trees (commit_sha, tree_json)
     VALUES ($1, $2)
     ON CONFLICT (commit_sha) DO NOTHING
     RETURNING *`,
    [commitSha, JSON.stringify(treeJson)]
  );
  return result.rows[0] ?? null;
}

export async function deleteExpired() {
  const result = await db.query(
    `DELETE FROM cached_repo_trees WHERE expires_at < now() RETURNING commit_sha`
  );
  return result.rowCount;
}