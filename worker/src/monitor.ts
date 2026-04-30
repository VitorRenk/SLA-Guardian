import { Queue, Worker, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import axios from "axios";
import cron from "node-cron";
import dotenv from "dotenv";
import { alertManager } from "./alert";
import { ConsoleChannel, WebhookChannel, SlackChannel } from "./notifications";

dotenv.config();

// 🔌 Conexão Redis (IMPORTANTE)
const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
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

// 🔔 Configurar canais de alerta
alertManager.addChannel(new ConsoleChannel());

if (process.env.WEBHOOK_URL) {
  alertManager.addChannel(new WebhookChannel(process.env.WEBHOOK_URL));
}

if (process.env.SLACK_WEBHOOK_URL) {
  alertManager.addChannel(new SlackChannel(process.env.SLACK_WEBHOOK_URL));
}

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
      // Disparar alerta de falha
      await alertManager.alert({
        service: url,
        status: "failure",
        message: `Falha ao verificar serviço: ${url}`,
        error: result.error,
        duration: 0,
        retryCount: job.attemptsMade,
        maxRetries: job.opts.attempts,
        timestamp: new Date(),
      });

      throw new Error(result.error || "Falha no monitoramento");
    }

    // ✅ Serviço OK - Verificar se estava falhando antes (recuperação)
    const alertStatus = alertManager.getStatus();
    const currentServiceStatus = alertStatus.find(
      (s) => s.service === TARGET_URL,
    );

    if (currentServiceStatus && currentServiceStatus.failures > 0) {
      // Estava falhando, agora recuperou!
      await alertManager.alert({
        service: TARGET_URL,
        status: "recovered",
        message: `Serviço recuperado: ${TARGET_URL}`,
        duration: result.duration,
        timestamp: new Date(),
      });
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
