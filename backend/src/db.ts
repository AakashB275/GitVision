import { Pool } from 'pg';
import dotenv from 'dotenv'

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon's pooled connection
  },
  max: 10,                     // max connections in pool — Neon free tier caps total conns, keep this modest
  idleTimeoutMillis: 30_000,   // close idle clients after 30s
  connectionTimeoutMillis: 5_000, // fail fast if Neon is unreachable
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(), // for transactions
};

export default db;