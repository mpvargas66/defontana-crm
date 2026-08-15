import { sql } from '@vercel/postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export { sql };
export const db = sql;
