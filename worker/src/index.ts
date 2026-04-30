// 🚀 SLA Guardian Worker - Main Entry Point

import "./monitor"; // Inicia scheduler e worker

console.log("🔧 Iniciando SLA Guardian Worker...\n");

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
