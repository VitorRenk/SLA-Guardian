import http from "http";
import client from "prom-client";

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "worker_",
});

export const targetUp = new client.Gauge({
  name: "target_up",
  help: "Whether the monitored target is reachable. 1 means up, 0 means down.",
  labelNames: ["target_url"] as const,
  registers: [register],
});

export const targetResponseTimeMs = new client.Gauge({
  name: "target_response_time_ms",
  help: "Latest response time from the monitored target in milliseconds.",
  labelNames: ["target_url"] as const,
  registers: [register],
});

export const targetStatusCode = new client.Gauge({
  name: "target_status_code",
  help: "Latest HTTP status code returned by the monitored target.",
  labelNames: ["target_url"] as const,
  registers: [register],
});

export const targetChecksTotal = new client.Counter({
  name: "target_checks_total",
  help: "Total number of target checks by result.",
  labelNames: ["target_url", "result"] as const,
  registers: [register],
});

export const targetFailuresTotal = new client.Counter({
  name: "target_failures_total",
  help: "Total number of failed target checks.",
  labelNames: ["target_url"] as const,
  registers: [register],
});

export const targetCheckDurationSeconds = new client.Histogram({
  name: "target_check_duration_seconds",
  help: "Target check duration in seconds by result.",
  labelNames: ["target_url", "result"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const targetLastCheckTimestampSeconds = new client.Gauge({
  name: "target_last_check_timestamp_seconds",
  help: "Unix timestamp of the latest target check.",
  labelNames: ["target_url"] as const,
  registers: [register],
});

export const incidentsOpenTotal = new client.Gauge({
  name: "incidents_open_total",
  help: "Current number of open incidents.",
  registers: [register],
});

export const incidentsRecordedTotal = new client.Counter({
  name: "incidents_recorded_total",
  help: "Total number of incidents opened.",
  registers: [register],
});

export const incidentsResolvedTotal = new client.Counter({
  name: "incidents_resolved_total",
  help: "Total number of incidents resolved.",
  registers: [register],
});

export function recordTargetCheck(params: {
  url: string;
  success: boolean;
  durationMs: number;
  statusCode?: number;
}): void {
  const result = params.success ? "success" : "failure";
  const labels = { target_url: params.url };

  targetUp.set(labels, params.success ? 1 : 0);
  targetResponseTimeMs.set(labels, params.durationMs);
  targetLastCheckTimestampSeconds.set(labels, Date.now() / 1000);
  targetChecksTotal.inc({ ...labels, result });
  targetCheckDurationSeconds.observe(
    { ...labels, result },
    params.durationMs / 1000,
  );

  if (params.statusCode !== undefined) {
    targetStatusCode.set(labels, params.statusCode);
  } else {
    targetStatusCode.set(labels, 0);
    targetFailuresTotal.inc(labels);
  }
}

export function setOpenIncidents(count: number): void {
  incidentsOpenTotal.set(count);
}

export function recordIncidentOpened(): void {
  incidentsRecordedTotal.inc();
}

export function recordIncidentResolved(): void {
  incidentsResolvedTotal.inc();
}

export function startMetricsServer(port: number): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.url !== "/metrics") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    res.writeHead(200, { "Content-Type": register.contentType });
    res.end(await register.metrics());
  });

  server.listen(port, () => {
    console.log(`Worker metrics exposed on port ${port}`);
  });

  return server;
}
