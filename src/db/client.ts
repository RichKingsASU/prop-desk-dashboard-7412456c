import { Pool } from "pg";
import { getSettings } from "../config/settings.js";

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) return pool;

  const { db } = getSettings();
  pool =
    db.mode === "url"
      ? new Pool({ connectionString: db.url })
      : new Pool({
          host: db.host,
          port: db.port,
          user: db.user,
          password: db.password,
          database: db.name,
        });

  return pool;
}

