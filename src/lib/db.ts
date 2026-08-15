import { sql } from '@vercel/postgres';

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment');
}

export { sql };
export const db = sql;
