import { Queue, Worker, QueueEvents, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import axios from "axios";
import cron from "node-cron";
import { alertManager } from "./alert";
import { ConsoleChannel, WebhookChannel, SlackChannel } from "./notifications";
import { recordTargetCheck, startMetricsServer } from "./metrics";
import { getDbPath, parseTargetUrls } from "./config";
import { IncidentStore } from "./incidents";

export interface ServiceCheckResult {
  success: boolean;
  status?: number;
  duration: number;
  error?: string;
}

export interface MonitorDependencies {
  incidentStore: IncidentStore;
}

const jobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 3000,
  },
};

export async function checkService(url: string): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    const response = await axios.get(url, { timeout: 5000 });
    const duration = Date.now() - start;

    console.log(`${url} OK - Status: ${response.status} - ${duration}ms`);
    recordTargetCheck({
      url,
      success: true,
      durationMs: duration,
      statusCode: response.status,
    });

    return { success: true, status: response.status, duration };
  } catch (error: any) {
    const duration = Date.now() - start;

    recordTargetCheck({
      url,
      success: false,
      durationMs: duration,
    });

    console.error(`Falha em ${url}:`, error.message);
    return { success: false, error: error.message, duration };
  }
}

export async function scheduleTargetChecks(
  queue: Queue,
  targetUrls: string[],
): Promise<void> {
  console.log(`Enviando jobs de monitoramento para ${targetUrls.length} alvo(s)...`);

  await Promise.all(
    targetUrls.map((url) => queue.add("check-url", { url }, jobOptions)),
  );
}

export async function processCheckJob(
  url: string,
  attemptsMade: number,
  maxRetries: number | undefined,
  dependencies: MonitorDependencies,
): Promise<ServiceCheckResult> {
  console.log(`Verificando: ${url}`);

  const result = await checkService(url);

  if (!result.success) {
    dependencies.incidentStore.recordFailure({
      serviceUrl: url,
      errorMessage: result.error || "Falha no monitoramento",
      durationMs: result.duration,
    });

    await alertManager.alert({
      service: url,
      status: "failure",
      message: `Falha ao verificar serviço: ${url}`,
      error: result.error,
      duration: result.duration,
      retryCount: attemptsMade,
      maxRetries,
      timestamp: new Date(),
    });

    throw new Error(result.error || "Falha no monitoramento");
  }

  const resolvedIncident = dependencies.incidentStore.resolveIncident(url);

  if (resolvedIncident) {
    await alertManager.alert({
      service: url,
      status: "recovered",
      message: `Serviço recuperado: ${url}`,
      duration: result.duration,
      timestamp: new Date(),
    });
  }

  return result;
}

export async function startMonitor(): Promise<void> {
  const METRICS_PORT = Number(process.env.WORKER_METRICS_PORT) || 3002;
  const TARGET_URLS = parseTargetUrls(process.env);
  const incidentStore = await IncidentStore.create(getDbPath(process.env));

  startMetricsServer(METRICS_PORT);

  const connection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
  });

  const queue = new Queue("sla-monitor", { connection });

  alertManager.addChannel(new ConsoleChannel());

  if (process.env.WEBHOOK_URL) {
    alertManager.addChannel(new WebhookChannel(process.env.WEBHOOK_URL));
  }

  if (process.env.SLACK_WEBHOOK_URL) {
    alertManager.addChannel(new SlackChannel(process.env.SLACK_WEBHOOK_URL));
  }

  cron.schedule("*/30 * * * * *", async () => {
    await scheduleTargetChecks(queue, TARGET_URLS);
  });

  const worker = new Worker(
    "sla-monitor",
    async (job) => {
      const { url } = job.data;
      return processCheckJob(url, job.attemptsMade, job.opts.attempts, {
        incidentStore,
      });
    },
    { connection },
  );

  const events = new QueueEvents("sla-monitor", { connection });

  events.on("completed", ({ jobId }) => {
    console.log(`Job ${jobId} concluído`);
  });

  events.on("failed", ({ jobId, failedReason }) => {
    console.log(`Job ${jobId} falhou: ${failedReason}`);
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
  });

  console.log(
    `Worker monitorando ${TARGET_URLS.length} alvo(s): ${TARGET_URLS.join(", ")}`,
  );
}
