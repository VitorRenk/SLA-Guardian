import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import request from "supertest";
import initSqlJs from "sql.js";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";

function tempDbPath(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "sla-api-")), "test.db");
}

async function createIncidentDb(dbPath: string): Promise<void> {
  const require = createRequire(__filename);
  const wasmPath = path.dirname(require.resolve("sql.js/dist/sql-wasm.wasm"));
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(wasmPath, file),
  });
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_url TEXT NOT NULL,
      status TEXT NOT NULL,
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

  db.run(
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
    ) VALUES (?, 'open', 'timeout', 1, ?, ?, NULL, 5000, ?, ?)
    `,
    [
      "https://example.com",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    ],
  );

  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  db.close();
}

describe("API app", () => {
  it("responds to health checks", async () => {
    const app = createApp({ dbPath: tempDbPath() });

    await request(app).get("/health").expect(200, { status: "ok" });
  });

  it("exposes Prometheus metrics", async () => {
    const app = createApp({ dbPath: tempDbPath() });
    const response = await request(app).get("/metrics").expect(200);

    expect(response.text).toContain("http_requests_total");
  });

  it("lists incidents and open incidents", async () => {
    const dbPath = tempDbPath();
    await createIncidentDb(dbPath);
    const app = createApp({ dbPath });

    const all = await request(app).get("/incidents").expect(200);
    const open = await request(app).get("/incidents/open").expect(200);

    expect(all.body.incidents).toHaveLength(1);
    expect(open.body.incidents).toHaveLength(1);
    expect(open.body.incidents[0].service_url).toBe("https://example.com");
  });

  it("returns a single incident by id", async () => {
    const dbPath = tempDbPath();
    await createIncidentDb(dbPath);
    const app = createApp({ dbPath });

    const response = await request(app).get("/incidents/1").expect(200);

    expect(response.body.incident.id).toBe(1);
  });

  it("returns 404 when an incident does not exist", async () => {
    const app = createApp({ dbPath: tempDbPath() });

    await request(app).get("/incidents/999").expect(404);
  });

  it("renders a readable incidents UI", async () => {
    const dbPath = tempDbPath();
    await createIncidentDb(dbPath);
    const app = createApp({ dbPath });

    const response = await request(app)
      .get("/incidents/ui")
      .expect("Content-Type", /html/)
      .expect(200);

    expect(response.text).toContain("Incidentes");
    expect(response.text).toContain("https://example.com");
    expect(response.text).toContain("timeout");
  });

  it("filters open incidents in the UI", async () => {
    const dbPath = tempDbPath();
    await createIncidentDb(dbPath);
    const app = createApp({ dbPath });

    const response = await request(app)
      .get("/incidents/ui?status=open")
      .expect("Content-Type", /html/)
      .expect(200);

    expect(response.text).toContain("https://example.com");
    expect(response.text).toContain("class=\"filter active\"");
  });

  it("renders resolved filter even when there are no resolved incidents", async () => {
    const dbPath = tempDbPath();
    await createIncidentDb(dbPath);
    const app = createApp({ dbPath });

    const response = await request(app)
      .get("/incidents/ui?status=resolved")
      .expect("Content-Type", /html/)
      .expect(200);

    expect(response.text).toContain("Nenhum incidente encontrado");
  });
});
