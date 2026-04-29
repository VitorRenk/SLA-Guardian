import { Queue, Worker, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import axios from "axios";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

// 🔌 Conexão Redis (IMPORTANTE)
const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
});

// 📦 Fila
const queue = new Queue("sla-monitor", { connection });

// 🎯 Job config (retry + backoff)
const jobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 3000,
  },
};

// 🌐 Serviço que será monitorado
const TARGET_URL = process.env.TARGET_URL || "https://google.com";

// 🔍 Função para verificar serviço
export async function checkService(url: string) {
  try {
    const start = Date.now();
    const response = await axios.get(url, { timeout: 5000 });
    const duration = Date.now() - start;

    console.log(`✅ ${url} OK - Status: ${response.status} - ${duration}ms`);
    return { success: true, status: response.status, duration };
  } catch (error: any) {
    console.error(`❌ Falha em ${url}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ⏱️ Scheduler (a cada 30s)
cron.schedule("*/30 * * * * *", async () => {
  console.log("⏱️ Enviando job de monitoramento...");
  await queue.add("check-url", { url: TARGET_URL }, jobOptions);
});

// 👷 Worker que processa a fila
const worker = new Worker(
  "sla-monitor",
  async (job) => {
    const { url } = job.data;
    console.log(`🔎 Verificando: ${url}`);

    const result = await checkService(url);

    if (!result.success) {
      throw new Error(result.error || "Falha no monitoramento");
    }

    return result;
  },
  { connection },
);

// 📡 Eventos (observabilidade básica)
const events = new QueueEvents("sla-monitor", { connection });

events.on("completed", ({ jobId }) => {
  console.log(`🎉 Job ${jobId} concluído`);
});

events.on("failed", ({ jobId, failedReason }) => {
  console.log(`🔥 Job ${jobId} falhou: ${failedReason}`);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});
