import db from '../db';

interface SaveRepoParams {
  userId:    string;
  repoUrl:   string;
  repoOwner: string;
  repoName:  string;
}

export async function insert(params: SaveRepoParams) {
  const { userId, repoUrl, repoOwner, repoName } = params;

  const result = await db.query(
    `INSERT INTO saved_repos (user_id, repo_url, repo_owner, repo_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, repo_url) DO NOTHING
     RETURNING *`,
    [userId, repoUrl, repoOwner, repoName]
  );
  if (result.rows[0]) return result.rows[0];

  const existing = await db.query(
    `SELECT * FROM saved_repos WHERE user_id = $1 AND repo_url = $2`,
    [userId, repoUrl]
  );
  return existing.rows[0];
}

export async function findByUser(userId: string) {
  const result = await db.query(
    `SELECT * FROM saved_repos WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows; 
}

export async function deleteByUserAndId(userId: string, savedRepoId: string) {
  const result = await db.query(
    `DELETE FROM saved_repos WHERE id = $1 AND user_id = $2 RETURNING *`,
    [savedRepoId, userId]
  );
  return result.rows[0] ?? null; 
}