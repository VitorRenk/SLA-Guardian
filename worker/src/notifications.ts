/**
 * 📮 Canais de Notificação
 * Implementa múltiplos canais para envio de alertas
 */

import axios from "axios";
import dotenv from "dotenv";
import { AlertPayload, AlertChannel } from "./alert";

dotenv.config();

/**
 * 💻 Canal Console (desenvolvimento)
 */
export class ConsoleChannel implements AlertChannel {
  async send(alert: AlertPayload): Promise<void> {
    const statusEmoji = {
      failure: "❌",
      recovered: "✅",
      degraded: "⚠️",
    };

    const timestamp = alert.timestamp.toLocaleString("pt-BR");

    console.log(`
┌─────────────────────────────────────────────────────────┐
│ ${statusEmoji[alert.status]} ALERTA DE MONITORAMENTO
├─────────────────────────────────────────────────────────┤
│ Serviço:     ${alert.service}
│ Status:      ${alert.status.toUpperCase()}
│ Mensagem:    ${alert.message}
│ Tempo:       ${timestamp}
${alert.error ? `│ Erro:        ${alert.error}` : ""}
${alert.retryCount !== undefined ? `│ Tentativas:  ${alert.retryCount}/${alert.maxRetries}` : ""}
│ Duração:     ${alert.duration}ms
└─────────────────────────────────────────────────────────┘
    `);
  }
}

/**
 * 🪝 Canal Webhook (HTTP POST)
 */
export class WebhookChannel implements AlertChannel {
  private webhookUrl: string;

  constructor(webhookUrl: string = process.env.WEBHOOK_URL || "") {
    this.webhookUrl = webhookUrl;
  }

  async send(alert: AlertPayload): Promise<void> {
    if (!this.webhookUrl) {
      console.warn("⚠️ WEBHOOK_URL não configurada");
      return;
    }

    try {
      const payload = {
        alert: {
          service: alert.service,
          status: alert.status,
          message: alert.message,
          error: alert.error,
          duration: alert.duration,
          retries: {
            current: alert.retryCount,
            max: alert.maxRetries,
          },
          timestamp: alert.timestamp.toISOString(),
        },
        metadata: {
          project: "SLA Guardian",
          environment: process.env.NODE_ENV || "development",
          version: "1.0.0",
        },
      };

      const response = await axios.post(this.webhookUrl, payload, {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      });

      console.log(`🪝 Webhook enviado com sucesso (${response.status})`);
    } catch (error: any) {
      console.error(`🪝 Erro ao enviar webhook:`, error.message);
    }
  }
}

/**
 * 📧 Canal Email (SMTP)
 * Requer nodemailer instalado
 */
export class EmailChannel implements AlertChannel {
  private transporter: any;
  private recipientEmail: string;

  constructor(recipientEmail?: string) {
    this.recipientEmail =
      recipientEmail || process.env.ALERT_EMAIL || "admin@example.com";

    // Verificar se nodemailer está disponível
    try {
      const nodemailer = require("nodemailer");

      const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      if (smtpConfig.host) {
        this.transporter = nodemailer.createTransport(smtpConfig);
      } else {
        console.warn(
          "⚠️ Configuração SMTP incompleta - Email channel desativado",
        );
      }
    } catch (error) {
      console.warn("⚠️ nodemailer não instalado - Email channel desativado");
    }
  }

  async send(alert: AlertPayload): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      const statusEmoji = {
        failure: "❌",
        recovered: "✅",
        degraded: "⚠️",
      };

      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: ${alert.status === "recovered" ? "#4CAF50" : "#f44336"}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f5f5f5; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; color: #333; }
    .value { color: #666; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusEmoji[alert.status]} Alerta SLA Guardian</h1>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Serviço:</span>
        <span class="value">${alert.service}</span>
      </div>
      <div class="field">
        <span class="label">Status:</span>
        <span class="value">${alert.status.toUpperCase()}</span>
      </div>
      <div class="field">
        <span class="label">Mensagem:</span>
        <span class="value">${alert.message}</span>
      </div>
      ${
        alert.error
          ? `
      <div class="field">
        <span class="label">Erro:</span>
        <span class="value">${alert.error}</span>
      </div>
      `
          : ""
      }
      <div class="field">
        <span class="label">Duração:</span>
        <span class="value">${alert.duration}ms</span>
      </div>
      <div class="field">
        <span class="label">Data/Hora:</span>
        <span class="value">${alert.timestamp.toLocaleString("pt-BR")}</span>
      </div>
    </div>
    <div class="footer">
      <p>SLA Guardian v1.0.0</p>
    </div>
  </div>
</body>
</html>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || "sla-guardian@example.com",
        to: this.recipientEmail,
        subject: `${statusEmoji[alert.status]} SLA Alert: ${alert.service}`,
        html,
      });

      console.log(`📧 Email enviado para ${this.recipientEmail}`);
    } catch (error: any) {
      console.error(`📧 Erro ao enviar email:`, error.message);
    }
  }
}

/**
 * 🔗 Canal Slack (via Webhook)
 */
export class SlackChannel implements AlertChannel {
  private webhookUrl: string;

  constructor(webhookUrl: string = process.env.SLACK_WEBHOOK_URL || "") {
    this.webhookUrl = webhookUrl;
  }

  async send(alert: AlertPayload): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }

    try {
      const colorMap = {
        failure: "danger",
        recovered: "good",
        degraded: "warning",
      };

      const payload = {
        attachments: [
          {
            color: colorMap[alert.status],
            title: `SLA Guardian - ${alert.status.toUpperCase()}`,
            fields: [
              {
                title: "Serviço",
                value: alert.service,
                short: true,
              },
              {
                title: "Status",
                value: alert.status,
                short: true,
              },
              {
                title: "Mensagem",
                value: alert.message,
                short: false,
              },
              ...(alert.error
                ? [
                    {
                      title: "Erro",
                      value: alert.error,
                      short: false,
                    },
                  ]
                : []),
              {
                title: "Duração",
                value: `${alert.duration}ms`,
                short: true,
              },
            ],
            footer: "SLA Guardian",
            ts: Math.floor(alert.timestamp.getTime() / 1000),
          },
        ],
      };

      await axios.post(this.webhookUrl, payload, {
        timeout: 5000,
        headers: { "Content-Type": "application/json" },
      });

      console.log(`💬 Mensagem enviada para Slack`);
    } catch (error: any) {
      console.error(`💬 Erro ao enviar para Slack:`, error.message);
    }
  }
}
