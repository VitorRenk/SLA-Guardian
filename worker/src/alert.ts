/**
 * 🔔 Sistema de Alertas Inteligente
 * Gerencia notificações de falhas com múltiplos canais
 */

export interface AlertPayload {
  service: string;
  status: "failure" | "recovered" | "degraded";
  message: string;
  duration?: number;
  error?: string;
  timestamp: Date;
  retryCount?: number;
  maxRetries?: number;
}

export interface AlertChannel {
  send(alert: AlertPayload): Promise<void>;
}

class AlertManager {
  private channels: AlertChannel[] = [];
  private failureCount: Map<string, number> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  private alertThreshold = 3; // Disparar alerta após 3 falhas
  private alertCooldown = 5 * 60 * 1000; // 5 minutos entre alertas do mesmo serviço

  addChannel(channel: AlertChannel): void {
    this.channels.push(channel);
  }

  async alert(payload: AlertPayload): Promise<void> {
    // Atualizar contadores
    if (payload.status === "failure") {
      const count = (this.failureCount.get(payload.service) || 0) + 1;
      this.failureCount.set(payload.service, count);

      // Verificar se atingiu threshold
      if (count < this.alertThreshold) {
        console.log(
          `⚠️ Falha ${count}/${this.alertThreshold} em ${payload.service}`,
        );
        return;
      }

      // Verificar cooldown para evitar spam
      const lastAlert = this.lastAlertTime.get(payload.service);
      if (lastAlert && Date.now() - lastAlert.getTime() < this.alertCooldown) {
        console.log(`⏱️ Alerta em cooldown para ${payload.service}`);
        return;
      }
    } else if (payload.status === "recovered") {
      this.failureCount.set(payload.service, 0);
    }

    // Atualizar timestamp do último alerta
    this.lastAlertTime.set(payload.service, new Date());

    // Disparar alertas em todos os canais
    console.log(`🔔 [ALERTA] ${payload.message}`);

    await Promise.all(
      this.channels.map((channel) =>
        channel.send(payload).catch((err) => {
          console.error(`❌ Erro ao enviar alerta via canal:`, err.message);
        }),
      ),
    );
  }

  getStatus(): { service: string; failures: number; lastAlert?: Date }[] {
    return Array.from(this.failureCount.entries()).map(
      ([service, failures]) => ({
        service,
        failures,
        lastAlert: this.lastAlertTime.get(service),
      }),
    );
  }

  reset(service: string): void {
    this.failureCount.delete(service);
    this.lastAlertTime.delete(service);
  }
}

export const alertManager = new AlertManager();
