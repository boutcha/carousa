import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to use the database.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  if (!db) {
    db = drizzle(pool, { schema });
  }

  return db;
}

export async function closeDb() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
  db = undefined;
}

export * from "./schema";
