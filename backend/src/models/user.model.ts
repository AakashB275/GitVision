import db from '../db';

interface UpsertUserParams {
  clerkId:string;
  username:string;
  email:string;
  oauthProvider:'github' | 'google' | 'email';
}

export async function upsert(params: UpsertUserParams) {
  const { clerkId, username, email, oauthProvider } = params;

  const result = await db.query(
    `INSERT INTO users (clerk_id, username, email, oauth_provider)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_id) DO UPDATE
       SET username   = EXCLUDED.username,
           updated_at = now()
     RETURNING *`,
    [clerkId, username, email, oauthProvider]
  );

  return result.rows[0];
}

export async function findByClerkId(clerkId: string) {
  const result = await db.query(
    'SELECT * FROM users WHERE clerk_id = $1',
    [clerkId]
  );
  return result.rows[0] ?? null;
}

export async function findById(id: string) {
  const result = await db.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}