import fs from "fs";
import path from "path";
import { createRequire } from "module";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import {
  recordIncidentOpened,
  recordIncidentResolved,
  setOpenIncidents,
} from "./metrics";

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

export class IncidentStore {
  private constructor(
    private readonly SQL: SqlJsStatic,
    private readonly db: Database,
    private readonly dbPath: string,
  ) {}

  static async create(dbPath: string): Promise<IncidentStore> {
    const require = createRequire(__filename);
    const wasmPath = path.dirname(require.resolve("sql.js/dist/sql-wasm.wasm"));
    const SQL = await initSqlJs({
      locateFile: (file) => path.join(wasmPath, file),
    });
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const db = fs.existsSync(dbPath)
      ? new SQL.Database(fs.readFileSync(dbPath))
      : new SQL.Database();

    const store = new IncidentStore(SQL, db, dbPath);
    store.migrate();
    store.persistAndSyncMetrics();
    return store;
  }

  recordFailure(params: {
    serviceUrl: string;
    errorMessage: string;
    durationMs: number;
    timestamp?: Date;
  }): Incident {
    const now = (params.timestamp || new Date()).toISOString();
    const existing = this.getOpenIncident(params.serviceUrl);

    if (existing) {
      this.db.run(
        `
        UPDATE incidents
        SET error_message = ?,
            failure_count = failure_count + 1,
            last_failure_at = ?,
            last_duration_ms = ?,
            updated_at = ?
        WHERE id = ?
        `,
        [
          params.errorMessage,
          now,
          params.durationMs,
          now,
          existing.id,
        ],
      );
      this.persistAndSyncMetrics();
      return this.getIncidentById(existing.id) as Incident;
    }

    this.db.run(
      `
      INSERT INTO incidents (
        service_url,
        status,
        error_message,
        failure_count,
        started_at,
        last_failure_at,
        resolved_at,
        last_duration_ms,
        created_at,
        updated_at
      ) VALUES (?, 'open', ?, 1, ?, ?, NULL, ?, ?, ?)
      `,
      [
        params.serviceUrl,
        params.errorMessage,
        now,
        now,
        params.durationMs,
        now,
        now,
      ],
    );

    recordIncidentOpened();
    this.persistAndSyncMetrics();
    return this.getOpenIncident(params.serviceUrl) as Incident;
  }

  resolveIncident(serviceUrl: string, timestamp: Date = new Date()): Incident | null {
    const existing = this.getOpenIncident(serviceUrl);

    if (!existing) {
      return null;
    }

    const now = timestamp.toISOString();
    this.db.run(
      `
      UPDATE incidents
      SET status = 'resolved',
          resolved_at = ?,
          updated_at = ?
      WHERE id = ?
      `,
      [now, now, existing.id],
    );

    recordIncidentResolved();
    this.persistAndSyncMetrics();
    return this.getIncidentById(existing.id);
  }

  getOpenIncident(serviceUrl: string): Incident | null {
    return this.getOne(
      "SELECT * FROM incidents WHERE service_url = ? AND status = 'open' ORDER BY id DESC LIMIT 1",
      [serviceUrl],
    );
  }

  listIncidents(status?: "open" | "resolved"): Incident[] {
    if (status) {
      return this.getAll(
        "SELECT * FROM incidents WHERE status = ? ORDER BY id DESC",
        [status],
      );
    }

    return this.getAll("SELECT * FROM incidents ORDER BY id DESC");
  }

  getIncidentById(id: number): Incident | null {
    return this.getOne("SELECT * FROM incidents WHERE id = ?", [id]);
  }

  countOpenIncidents(): number {
    const result = this.db.exec(
      "SELECT COUNT(*) AS count FROM incidents WHERE status = 'open'",
    );

    return Number(result[0]?.values[0]?.[0] || 0);
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_url TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('open', 'resolved')),
        error_message TEXT,
        failure_count INTEGER NOT NULL DEFAULT 1,
        started_at TEXT NOT NULL,
        last_failure_at TEXT NOT NULL,
        resolved_at TEXT,
        last_duration_ms INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_incidents_service_status
      ON incidents(service_url, status);
    `);
  }

  private persistAndSyncMetrics(): void {
    this.persist();
    setOpenIncidents(this.countOpenIncidents());
  }

  private persist(): void {
    fs.writeFileSync(this.dbPath, Buffer.from(this.db.export()));
  }

  private getAll(sql: string, params: any[] = []): Incident[] {
    const statement = this.db.prepare(sql, params);
    const rows: Incident[] = [];

    while (statement.step()) {
      rows.push(statement.getAsObject() as unknown as Incident);
    }

    statement.free();
    return rows;
  }

  private getOne(sql: string, params: unknown[] = []): Incident | null {
    return this.getAll(sql, params)[0] || null;
  }
}
