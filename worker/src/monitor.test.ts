import fs from "fs";
import os from "os";
import path from "path";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IncidentStore } from "./incidents";
import { checkService, processCheckJob } from "./monitor";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedAxiosGet = vi.mocked(axios.get);

function tempDbPath(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "sla-monitor-")), "test.db");
}

describe("checkService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when the target responds", async () => {
    mockedAxiosGet.mockResolvedValueOnce({ status: 200 });

    const result = await checkService("https://example.com");

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
  });

  it("returns failure when the target request fails", async () => {
    mockedAxiosGet.mockRejectedValueOnce(new Error("ENOTFOUND"));

    const result = await checkService("https://missing.example");

    expect(result.success).toBe(false);
    expect(result.error).toBe("ENOTFOUND");
  });
});

describe("processCheckJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens an incident on failure and resolves it on recovery", async () => {
    const incidentStore = await IncidentStore.create(tempDbPath());
    mockedAxiosGet.mockRejectedValueOnce(new Error("timeout"));

    await expect(
      processCheckJob("https://example.com", 1, 5, { incidentStore }),
    ).rejects.toThrow("timeout");

    expect(incidentStore.listIncidents("open")).toHaveLength(1);

    mockedAxiosGet.mockResolvedValueOnce({ status: 200 });

    await processCheckJob("https://example.com", 0, 5, { incidentStore });

    expect(incidentStore.listIncidents("open")).toHaveLength(0);
    expect(incidentStore.listIncidents("resolved")).toHaveLength(1);
  });
});
