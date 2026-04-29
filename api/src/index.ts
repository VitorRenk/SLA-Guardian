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

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Metrics endpoint
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Test endpoint
app.get("/", (_req, res) => {
  res.json({ message: "SLA Guardian API running 🚀" });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
