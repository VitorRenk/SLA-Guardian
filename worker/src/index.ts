import dotenv from "dotenv";
import { startMonitor } from "./monitor";

dotenv.config();

console.log("Iniciando SLA Guardian Worker...\n");

startMonitor().catch((error) => {
  console.error("Erro ao iniciar worker:", error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("\nEncerrando worker...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nEncerrando worker (SIGTERM)...");
  process.exit(0);
});

console.log("Worker pronto para monitorar serviços\n");
