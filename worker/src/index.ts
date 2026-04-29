// 🚀 SLA Guardian Worker - Main Entry Point

import "./monitor"; // Inicia scheduler e worker
import { startHealthCheckScheduler } from "./scheduler";

console.log("🔧 Iniciando SLA Guardian Worker...\n");

// Inicia o scheduler de health checks adicionais
startHealthCheckScheduler();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Encerrando worker...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Encerrando worker (SIGTERM)...");
  process.exit(0);
});

console.log("✅ Worker rodando e pronto para monitorar serviços\n");
