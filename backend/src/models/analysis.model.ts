import db from '../db'

interface InsertParams {
  userId:    string;
  repoUrl:   string;
  repoOwner: string;
  repoName:  string;
  commitSha: string;
  status:    'pending' | 'done' | 'failed';
}

export async function insert(params: InsertParams) {
  const { userId, repoUrl, repoOwner, repoName, commitSha, status } = params;
  const result = await db.query(
    `INSERT INTO analyses (user_id, repo_url, repo_owner, repo_name, commit_sha, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, repoUrl, repoOwner, repoName, commitSha, status]
  );
  return result.rows[0];
}

export async function updateStatus(id: string, status: 'done' | 'failed', errorMsg?: string) {
  await db.query(
    `UPDATE analyses SET status = $1, error_msg = $2 WHERE id = $3`,
    [status, errorMsg ?? null, id]
  );
}

export async function findByUser(userId: string) {
  const result = await db.query(
    `SELECT a.*, cg.graph_json
     FROM analyses a
     LEFT JOIN cached_graphs cg ON cg.commit_sha = a.commit_sha
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function findById(id: string) {
  const result = await db.query(
    `SELECT a.*, cg.graph_json
     FROM analyses a
     LEFT JOIN cached_graphs cg ON cg.commit_sha = a.commit_sha
     WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}