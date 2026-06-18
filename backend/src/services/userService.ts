import { clerkClient } from '@clerk/express';
import db from '../db';

export const userService = {
  async getOrCreateUser(clerkId: string) {
    // 1. check if user already exists in our DB
    const existing = await db.query(
      'SELECT * FROM users WHERE clerk_id = $1',
      [clerkId]
    );
    if (existing.rows[0]) {
      return existing.rows[0];
    }

    // 2. fetch their profile from Clerk to populate our row
    const clerkUser = await clerkClient.users.getUser(clerkId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error('Clerk user has no email address');
    }

    const username = clerkUser.username
      ?? email.split('@')[0]; // fallback for Google/email signups with no username

    const provider = clerkUser.externalAccounts[0]?.provider ?? 'email';
    const oauthProvider = provider.includes('github') ? 'github'
                        : provider.includes('google') ? 'google'
                        : 'email';

    // 3. insert into our DB — ON CONFLICT guards against race conditions
    //    if two requests for the same new user land at the same time
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
};