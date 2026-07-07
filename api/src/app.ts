import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import client from "prom-client";
import { getDbPath, getIncidentById, listIncidents } from "./incidents";

export function createApp(options: { dbPath?: string } = {}) {
  const app = express();
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  const dbPath = options.dbPath || getDbPath(process.env);

  const httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP requests by method, route and status.",
    labelNames: ["method", "route", "status"] as const,
    registers: [register],
  });

  const httpRequestDurationSeconds = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds by method, route and status.",
    labelNames: ["method", "route", "status"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });

  app.use(cors());
  app.use(express.json());
  app.use(helmet());
  app.use(morgan("dev"));

  app.use((req, res, next) => {
    if (req.path === "/metrics") {
      return next();
    }

    const endTimer = httpRequestDurationSeconds.startTimer();

    res.on("finish", () => {
      const route = req.route?.path ?? req.path;
      const labels = {
        method: req.method,
        route: String(route),
        status: String(res.statusCode),
      };

      httpRequestsTotal.inc(labels);
      endTimer(labels);
    });

    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  app.get("/incidents", async (_req, res, next) => {
    try {
      res.json({ incidents: await listIncidents(dbPath) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/incidents/open", async (_req, res, next) => {
    try {
      res.json({ incidents: await listIncidents(dbPath, "open") });
    } catch (error) {
      next(error);
    }
  });

  app.get("/incidents/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "invalid_incident_id" });
        return;
      }

      const incident = await getIncidentById(dbPath, id);

      if (!incident) {
        res.status(404).json({ error: "incident_not_found" });
        return;
      }

      res.json({ incident });
    } catch (error) {
      next(error);
    }
  });

  app.get("/", (_req, res) => {
    res.json({ message: "SLA Guardian API running" });
  });

  return app;
}
