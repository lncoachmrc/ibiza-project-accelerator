import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = Record<string, unknown>>(text: string, params?: unknown[]) {
  return pool.query<T>(text, params);
}

export async function closeDb() {
  await pool.end();
}
