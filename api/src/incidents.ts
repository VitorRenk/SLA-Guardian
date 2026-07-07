import fs from "fs";
import path from "path";
import { createRequire } from "module";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";

export interface Incident {
  id: number;
  service_url: string;
  status: "open" | "resolved";
  error_message: string | null;
  failure_count: number;
  started_at: string;
  last_failure_at: string;
  resolved_at: string | null;
  last_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

let sqlPromise: Promise<SqlJsStatic> | null = null;

function getSql(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    const require = createRequire(__filename);
    const wasmPath = path.dirname(require.resolve("sql.js/dist/sql-wasm.wasm"));
    sqlPromise = initSqlJs({
      locateFile: (file) => path.join(wasmPath, file),
    });
  }

  return sqlPromise;
}

export function getDbPath(env: NodeJS.ProcessEnv): string {
  return env.DB_PATH || "/data/sla-guardian.db";
}

export async function listIncidents(
  dbPath: string,
  status?: "open" | "resolved",
): Promise<Incident[]> {
  const db = await loadDatabase(dbPath);

  if (!db) {
    return [];
  }

  const incidents = status
    ? getAll(db, "SELECT * FROM incidents WHERE status = ? ORDER BY id DESC", [
        status,
      ])
    : getAll(db, "SELECT * FROM incidents ORDER BY id DESC");

  db.close();
  return incidents;
}

export async function getIncidentById(
  dbPath: string,
  id: number,
): Promise<Incident | null> {
  const db = await loadDatabase(dbPath);

  if (!db) {
    return null;
  }

  const incident =
    getAll(db, "SELECT * FROM incidents WHERE id = ?", [id])[0] || null;
  db.close();
  return incident;
}

async function loadDatabase(dbPath: string): Promise<Database | null> {
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const SQL = await getSql();
  return new SQL.Database(fs.readFileSync(dbPath));
}

function getAll(db: Database, sql: string, params: any[] = []): Incident[] {
  const statement = db.prepare(sql, params);
  const rows: Incident[] = [];

  while (statement.step()) {
    rows.push(statement.getAsObject() as unknown as Incident);
  }

  statement.free();
  return rows;
}
