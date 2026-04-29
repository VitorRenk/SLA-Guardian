import { checkService } from "./monitor";

const services = [
  process.env.TARGET_URL || "https://google.com",
  process.env.SECONDARY_URL || "https://example.com",
];

export async function runHealthCheck() {
  console.log("🏥 Iniciando verificação de saúde dos serviços...");

  for (const service of services) {
    const result = await checkService(service);

    const log = {
      service,
      ...result,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(log, null, 2));

    if (!result.success) {
      console.log(`⚠️ Recovery acionado para ${service}`);
    }
  }
}

// Executa periodicamente (a cada 60s)
export function startHealthCheckScheduler() {
  console.log("🚀 Scheduler de health check iniciado");
  setInterval(runHealthCheck, 60000);
}
