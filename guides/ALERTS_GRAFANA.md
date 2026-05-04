# 🔔 Guia Completo de Alertas no Grafana

## 📋 Visão Geral

Este guia explica como configurar alertas no Grafana para o SLA Guardian, incluindo notificações via Slack, Email, Webhooks e mais.

## 🏗️ Arquitetura de Alertas

```
┌─────────────────────────────────────────────────────────────┐
│                     Prometheus                              │
│  - Coleta métricas a cada 15s                               │
│  - Avalia regras a cada 30s (prometheus-rules.yml)          │
│  - Dispara alertas quando condições são atingidas           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Alertmanager                             │
│  - Agrupa alertas similares                                 │
│  - Roteia para canais apropriados                           │
│  - Evita duplicatas (inhibit_rules)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌─────────┐     ┌─────────┐     ┌──────────┐
   │  Slack  │     │  Email  │     │ Webhook  │
   └─────────┘     └─────────┘     └──────────┘
        │                │                │
        ▼                ▼                ▼
   Notificação   Notificação       Webhook
   em canal      para email        customizado
```

## 📊 Componentes Principais

### 1️⃣ Prometheus Rules (`prometheus-rules.yml`)

Define as condições para disparar alertas:

```yaml
groups:
  - name: sla_guardian_alerts
    rules:
      - alert: APIUnresponsive
        expr: up{job="sla-guardian-api"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "API não está respondendo"
```

**Componentes:**

- `expr`: Expressão PromQL que dispara o alerta
- `for`: Duração mínima que a condição deve ser verdadeira
- `labels`: Tags para classificação e roteamento
- `annotations`: Informações descritivas

### 2️⃣ Alertmanager (`alertmanager/config.yml`)

Gerencia o roteamento e envio de notificações:

```yaml
route:
  receiver: "default"
  routes:
    - match:
        severity: critical
      receiver: "critical"

receivers:
  - name: "critical"
    slack_configs:
      - channel: "#critical-alerts"
    email_configs:
      - to: "admin@example.com"
```

### 3️⃣ Templates (`alertmanager/templates.tmpl`)

Formata as mensagens de alerta em Slack e Email.

### 4️⃣ Grafana Alertmanager Config

Define o Alertmanager como destino no Grafana.

## 🚀 Configuração Passo-a-Passo

### Passo 1: Variáveis de Ambiente

Crie um arquivo `.env` com as configurações:

```bash
# Slack Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email SMTP (Gmail)
SMTP_PASSWORD=your-app-password

# Webhook Customizado
WEBHOOK_URL=https://seu-servidor.com/webhooks
```

### Passo 2: Atualizar Docker Compose

Adicione o Alertmanager ao `docker-compose.yml`:

```yaml
alertmanager:
  image: prom/alertmanager:latest
  container_name: sla-guardian-alertmanager
  ports:
    - "9093:9093"
  volumes:
    - ./alertmanager/config.yml:/etc/alertmanager/config.yml
    - ./alertmanager/templates.tmpl:/etc/alertmanager/templates/templates.tmpl
    - alertmanager-data:/alertmanager
  environment:
    - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
    - SMTP_PASSWORD=${SMTP_PASSWORD}
  command:
    - "--config.file=/etc/alertmanager/config.yml"
    - "--storage.path=/alertmanager"
  restart: always
```

### Passo 3: Configurar Prometheus para Usar Alertmanager

Edite `prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

rule_files:
  - "prometheus-rules.yml"
```

### Passo 4: Iniciar os Serviços

```bash
docker-compose up -d alertmanager prometheus grafana
```

### Passo 5: Configurar no Grafana

1. Acesse: http://localhost:3001 (admin/admin)
2. Vá para: **Administration** → **Alerting** → **Contact Points**
3. Clique em **New contact point**
4. Configure cada canal:

#### Para Slack

```
Name: Slack
Type: Slack
Webhook URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Channel: #alerts
```

#### Para Email

```
Name: Email
Type: Email
Email Address: seu-email@gmail.com
SMTP Server: smtp.gmail.com:587
SMTP User: seu-email@gmail.com
SMTP Password: app-password
```

#### Para Webhook Customizado

```
Name: Webhook
Type: Webhook
URL: https://seu-servidor.com/webhooks/alerts
HTTP Method: POST
```

### Passo 6: Configurar Notification Policies

1. Vá para: **Administration** → **Alerting** → **Notification Policies**
2. Defina o contato padrão e rotas específicas

## 📧 Configurar Notificações por Email

### Gmail com App Password

1. Ative 2-Step Verification em https://myaccount.google.com/security
2. Vá para https://myaccount.google.com/apppasswords
3. Selecione: Mail + Windows Computer
4. Copie a senha gerada
5. Use no `.env`:

```bash
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Outlook/Office 365

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASSWORD=sua-senha
```

### SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxx
```

## 💬 Configurar Notificações no Slack

### 1. Criar Webhook do Slack

1. Acesse: https://api.slack.com/apps
2. Clique em **Create New App** → **From scratch**
3. Nome: "SLA Guardian Alerts"
4. Workspace: Selecione seu workspace
5. Em **Incoming Webhooks**, ative e clique **Add New Webhook**
6. Selecione canal: #alerts
7. Copie a URL

### 2. Usar no Alertmanager

```yaml
receivers:
  - name: "slack"
    slack_configs:
      - api_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
        channel: "#alerts"
        title: "🚨 {{ .Status | upper }} Alert"
```

## 🎯 Exemplos de Alertas Configurados

### 1. API Unresponsive (Crítico)

- **Condição**: API não responde por 2 minutos
- **Ação**: Slack + Email
- **Descrição**: "API SLA Guardian não está respondendo"

### 2. High Error Rate (Aviso)

- **Condição**: Taxa de erro > 5% por 5 minutos
- **Ação**: Slack
- **Descrição**: "Taxa de erro elevada"

### 3. High Latency (Aviso)

- **Condição**: P95 latência > 1 segundo por 5 minutos
- **Ação**: Slack
- **Descrição**: "Latência P95 elevada"

### 4. Critical Latency (Crítico)

- **Condição**: P99 latência > 5 segundos por 2 minutos
- **Ação**: Slack + Email + Escala
- **Descrição**: "Latência crítica"

### 5. High Memory Usage (Aviso)

- **Condição**: Uso de memória > 85% por 10 minutos
- **Ação**: Slack
- **Descrição**: "Memória alta"

### 6. High CPU Usage (Aviso)

- **Condição**: CPU > 80% por 10 minutos
- **Ação**: Slack
- **Descrição**: "CPU alta"

## 🔍 Visualizar Alertas

### Prometheus

```
http://localhost:9090/alerts
```

Mostra todos os alertas ativos, pendentes e resolvidos.

### Grafana

```
http://localhost:3001/alerting/list
```

Mostra histórico de alertas e notificações.

### Alertmanager

```
http://localhost:9093
```

Interface do Alertmanager para gerenciar silenciamentos e rotas.

## 🛑 Silenciar Alertas (Maintenance)

No Alertmanager:

1. Acesse: http://localhost:9093
2. Clique em **Silences**
3. Clique em **New Silence**
4. Configure:
   - **Matcher**: Select alert name
   - **Duration**: Por quanto tempo
   - **Creator**: Seu nome
   - **Comment**: Motivo do silenciamento

## 📊 Testar Alertas

### 1. Simular Falha da API

```bash
# Parar a API
docker stop sla-guardian-api

# Esperar 2+ minutos para alerta disparar
# Você receberá notificações

# Reiniciar a API
docker start sla-guardian-api
```

### 2. Verificar Logs do Alertmanager

```bash
docker logs sla-guardian-alertmanager -f
```

### 3. Testar Webhook Customizado

Use um serviço como webhook.site para testar:

```bash
WEBHOOK_URL=https://webhook.site/your-unique-id
```

## ⚙️ Configurações Avançadas

### Inhibition Rules

Evitar alertas duplicados quando um alerta crítico já está ativo:

```yaml
inhibit_rules:
  - source_match:
      severity: "critical"
    target_match:
      severity: "warning"
    equal: ["alertname", "service"]
```

### Grouping

Agrupar alertas similares:

```yaml
route:
  group_by: ["alertname", "cluster", "service"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
```

### External URL

Para links nos alertas apontarem para o dashboard correto:

```yaml
global:
  external_url: "https://seu-grafana.com"
```

## 🔗 Integrações Suportadas

- ✅ Slack
- ✅ Email (SMTP)
- ✅ Webhooks HTTP
- ✅ PagerDuty
- ✅ Opsgenie
- ✅ Discord
- ✅ Telegram
- ✅ Microsoft Teams
- ✅ Mattermost
- ✅ Webhooks genéricos

## 📝 Exemplos de Payload

### Webhook Customizado

```json
{
  "status": "firing",
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "APIUnresponsive",
        "severity": "critical"
      },
      "annotations": {
        "summary": "API SLA Guardian não está respondendo",
        "description": "A API em api:3000 não respondeu nos últimos 2 minutos"
      },
      "startsAt": "2026-05-04T10:30:00Z",
      "endsAt": "0001-01-01T00:00:00Z"
    }
  ]
}
```

### Formato Slack

```
🔴 CRÍTICO ALERTA
━━━━━━━━━━━━━━━━━━━━━
Alerta: APIUnresponsive
Severidade: critical
Descrição: A API não está respondendo
Detalhes: Verifique status da API e logs
Início: 2026-05-04 10:30:00
```

## 🚨 Troubleshooting

### Alertas não disparando

1. Verificar Prometheus targets: http://localhost:9090/targets
2. Verificar regras de alerta: http://localhost:9090/rules
3. Verificar logs: `docker logs sla-guardian-prometheus -f`

### Notificações não chegando

1. Verificar Alertmanager: http://localhost:9093
2. Verificar configuração de contato no Grafana
3. Testar webhook com curl:
   ```bash
   curl -X POST https://seu-webhook.com -d '{"test": "alert"}'
   ```

### Alertas duplicados

1. Configurar `inhibit_rules` no Alertmanager
2. Ajustar `group_interval` e `group_wait`
3. Verificar `repeat_interval`

## 📚 Recursos Adicionais

- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/)
- [PromQL Operators](https://prometheus.io/docs/prometheus/latest/querying/operators/)
