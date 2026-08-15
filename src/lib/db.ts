import { sql } from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const db = sql(process.env.DATABASE_URL);

export async function query<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  try {
    const result = await db(strings, ...values);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  try {
    const results = await db(strings, ...values);
    return results.length > 0 ? (results[0] as T) : null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function transaction<T>(
  callback: (sql: typeof db) => Promise<T>
): Promise<T> {
  try {
    return await callback(db);
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await db`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}
