import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { IncidentStore } from "./incidents";

function tempDbPath(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "sla-incidents-")), "test.db");
}

describe("IncidentStore", () => {
  it("opens, updates and resolves incidents", async () => {
    const store = await IncidentStore.create(tempDbPath());

    const opened = store.recordFailure({
      serviceUrl: "https://example.com",
      errorMessage: "timeout",
      durationMs: 5000,
      timestamp: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(opened.status).toBe("open");
    expect(opened.failure_count).toBe(1);

    const updated = store.recordFailure({
      serviceUrl: "https://example.com",
      errorMessage: "dns",
      durationMs: 10,
      timestamp: new Date("2026-01-01T00:01:00.000Z"),
    });

    expect(updated.id).toBe(opened.id);
    expect(updated.failure_count).toBe(2);
    expect(updated.error_message).toBe("dns");

    const resolved = store.resolveIncident(
      "https://example.com",
      new Date("2026-01-01T00:02:00.000Z"),
    );

    expect(resolved?.status).toBe("resolved");
    expect(store.listIncidents("open")).toHaveLength(0);
    expect(store.listIncidents()).toHaveLength(1);
  });
});
