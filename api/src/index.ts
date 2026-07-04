import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import client from "prom-client";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

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

app.get("/", (_req, res) => {
  res.json({ message: "SLA Guardian API running" });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
