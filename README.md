# �️ SLA Guardian

> **Sistema de Monitoramento e Garantia de SLA em Tempo Real**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-red?logo=redis)](https://redis.io/)

---

## 📋 Sobre o Projeto

**SLA Guardian** é uma solução robusta e escalável para monitorar a disponibilidade de serviços em tempo real. Desenvolvido com foco em confiabilidade, o projeto implementa um sistema distribuído que:

✅ Monitora múltiplos endpoints simultaneamente  
✅ Implementa retry automático com backoff exponencial  
✅ Coleta métricas via Prometheus  
✅ Processa jobs de forma assíncrona e distribuída  
✅ Fornece alertas e observabilidade

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    SLA Guardian System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐     ┌─────────────┐ │
│  │   Express    │◄────►│    Redis     │◄───►│  BullMQ     │ │
│  │     API      │      │   Message    │     │   Worker    │ │
│  │              │      │    Broker    │     │             │ │
│  └──────────────┘      └──────────────┘     └─────────────┘ │
│       :3000                  :6379          Scheduler/Retry  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Prometheus Metrics │ Health Checks │ Observabilidade   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

| Camada           | Tecnologia     | Propósito                 |
| ---------------- | -------------- | ------------------------- |
| **Runtime**      | Node.js 20     | Ambiente JavaScript       |
| **Linguagem**    | TypeScript     | Type-safety e melhor DX   |
| **API**          | Express.js     | Servidor HTTP             |
| **Queue**        | BullMQ         | Processamento distribuído |
| **Cache/PubSub** | Redis          | Fila, cache e broadcast   |
| **Scheduler**    | node-cron      | Execução agendada         |
| **HTTP Client**  | axios          | Requisições HTTP          |
| **Monitoring**   | Prometheus     | Coleta de métricas        |
| **Logging**      | Pino           | Logs estruturados         |
| **Container**    | Docker Compose | Orquestração              |

---

## ✨ Features Principais

🔄 **Retry Automático com Backoff Exponencial**

- Implementação robusta que trata falhas transitórias
- Exponential backoff para evitar sobrecarga

📊 **Monitoramento em Tempo Real**

- Verificação de saúde a cada 30 segundos
- Métricas detalhadas por serviço
- Tempo de resposta individual

⚡ **Processamento Distribuído**

- BullMQ para filas resilientes
- Múltiplos workers paralelos
- Jobs persistidos no Redis

� **Sistema de Alertas Multi-Canal** ⭐ NOVO

- Console (desenvolvimento)
- Webhook customizado (HTTP POST)
- Slack integration (notificações em tempo real)
- Email SMTP (alertas por email)
- Inteligência para evitar spam (threshold + cooldown)
- Notificações de recuperação automáticas

�📈 **Observabilidade**

- Prometheus metrics integradas
- Health check endpoints
- Logs estruturados com Pino

🐳 **Pronto para Produção**

- Docker & Docker Compose
- Graceful shutdown
- Tratamento de sinais SIGINT/SIGTERM

---

## 🚀 Quick Start

### 📋 Pré-requisitos

- Docker & Docker Compose
- Node.js 20+
- npm 10+

### ⚡ Instalação (1 minuto)

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/sla-guardian.git
cd sla-guardian

# Instalar dependências
npm install
cd api && npm install && cd ..
cd worker && npm install && cd ..
```

### 🎯 Executar com Docker Compose

```bash
docker-compose up --build
```

Serviços iniciados:

- 🔵 **API**: http://localhost:3000
- 📊 **Métricas**: http://localhost:3000/metrics
- 📮 **Redis**: localhost:6379

### 🧪 Testar a API

```bash
# Health check
curl http://localhost:3000/health

# Endpoint raiz
curl http://localhost:3000/

# Métricas Prometheus
curl http://localhost:3000/metrics
```

---

## 📡 Endpoints da API

| Método | Endpoint   | Descrição                      | Status |
| ------ | ---------- | ------------------------------ | ------ |
| GET    | `/health`  | Verificar saúde da API         | ✅ 200 |
| GET    | `/`        | Informação geral da API        | ✅ 200 |
| GET    | `/metrics` | Métricas em formato Prometheus | ✅ 200 |

### Exemplo de Resposta

```json
// GET /health
{
  "status": "ok"
}

// GET /
{
  "message": "SLA Guardian API running 🚀"
}

// GET /metrics (Prometheus format)
# HELP process_cpu_user_seconds_total Total user CPU time spent...
# TYPE process_cpu_user_seconds_total counter
```

---

## 🔧 Configuração

Crie ou edite `.env` nos diretórios:

### `api/.env`

```env
PORT=3000
REDIS_HOST=redis
REDIS_PORT=6379
```

### `worker/.env`

```env
REDIS_HOST=redis
REDIS_PORT=6379
TARGET_URL=https://google.com
SECONDARY_URL=https://example.com
```

---

## � Sistema de Alertas Inteligente

O SLA Guardian possui um sistema robusto de notificações multi-canal que permite enviar alertas através de diferentes plataformas.

### 📬 Canais Disponíveis

#### 💻 Console (Padrão)

Exibe alertas no terminal do worker. Perfeito para desenvolvimento.

```bash
┌─────────────────────────────────────────────────────────┐
│ ❌ ALERTA DE MONITORAMENTO
├─────────────────────────────────────────────────────────┤
│ Serviço:     https://google.com
│ Status:      FAILURE
│ Mensagem:    Falha ao verificar serviço
│ Tempo:       29/04/2026 14:30:45
│ Erro:        getaddrinfo ENOTFOUND
│ Tentativas:  3/5
│ Duração:     0ms
└─────────────────────────────────────────────────────────┘
```

#### 🪝 Webhook Genérico

Envie alertas para qualquer URL que aceite POST HTTP.

```env
WEBHOOK_URL=https://seu-servidor.com/alerts
```

Payload enviado:

```json
{
  "alert": {
    "service": "https://google.com",
    "status": "failure",
    "message": "Falha ao verificar serviço",
    "error": "Timeout exceeded",
    "duration": 5000,
    "timestamp": "2026-04-29T14:30:45.000Z"
  },
  "metadata": {
    "project": "SLA Guardian",
    "environment": "production",
    "version": "1.0.0"
  }
}
```

#### 💬 Slack

Integração nativa com Slack para notificações em tempo real.

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Como obter Webhook URL do Slack:**

1. Acesse https://api.slack.com/apps
2. Crie uma nova app ou selecione existente
3. Vá em "Incoming Webhooks"
4. Ative e clique em "Add New Webhook to Workspace"
5. Selecione o canal desejado
6. Copie o URL gerado

#### 📧 Email

Notificações por email via SMTP.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-ou-app-password
SMTP_FROM=sla-guardian@example.com
ALERT_EMAIL=admin@example.com
```

**Configuração Gmail:**

1. Ative "Menos segurança" ou use "Senha de Aplicativo"
2. Para 2FA, gere uma app-specific password
3. Use a app-specific password no `SMTP_PASS`

### ⚙️ Configuração de Alertas

```env
# Console (sempre ativo)

# Webhook customizado
WEBHOOK_URL=https://seu-webhook.com/alerts

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=app-password
ALERT_EMAIL=admin@example.com
```

### 🎯 Lógica Inteligente de Alertas

- **Threshold**: Dispara alerta apenas após 3 falhas consecutivas
- **Cooldown**: Evita spam com intervalo de 5 minutos entre alertas do mesmo serviço
- **Recuperação**: Notifica automaticamente quando o serviço volta a funcionar
- **Context**: Inclui número de tentativas, duração e erro específico

---

## 📁 Estrutura do Projeto

```
sla-guardian/
├── api/
│   ├── src/
│   │   └── index.ts          # Express server + Prometheus
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── worker/
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── monitor.ts        # BullMQ + Worker logic
│   │   ├── scheduler.ts      # Health check scheduling
│   │   ├── alert.ts          # 🔔 Alert manager
│   │   ├── notifications.ts  # 📮 Canais de notificação
│   │   ├── retry.ts          # Retry logic
│   │   └── types.ts          # TypeScript definitions
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── docker-compose.yml        # Orquestração
├── .env.example
├── .gitignore
└── README.md
```

---

## 🧪 Desenvolvimento Local (sem Docker)

### Terminal 1 - Redis

```bash
docker run -p 6379:6379 redis:7-alpine
```

### Terminal 2 - API

```bash
cd api && npm run dev
```

### Terminal 3 - Worker

```bash
cd worker && npm run dev
```

### Terminal 4 - Logs

```bash
# Testar endpoints
curl http://localhost:3000/health
```

---

## 🔄 Fluxo de Monitoramento

```
1. Scheduler (a cada 30s)
   ↓
2. Cria job na fila Redis
   ↓
3. Worker processa job
   ↓
4. Tenta acessar URL com timeout 5s
   ↓
5. Sucesso?
   ├─ Sim → Log + Métrica ✅
   └─ Não → Retry com backoff exponencial
   ↓
6. Max retries?
   ├─ Sim → Falha registrada 🔥
   └─ Não → Tenta novamente
```

---

## 📊 Exemplo de Saída

```bash
$ docker-compose up

sla-guardian-redis    | Ready to accept connections
sla-guardian-api     | 🔧 Iniciando SLA Guardian API...
sla-guardian-api     | API rodando na porta 3000
sla-guardian-worker  | 🔧 Iniciando SLA Guardian Worker...
sla-guardian-worker  | ✅ Worker rodando e pronto para monitorar serviços
sla-guardian-worker  | 🚀 Scheduler de health check iniciado

// Após 30 segundos:
sla-guardian-worker  | ⏱️ Enviando job de monitoramento...
sla-guardian-worker  | 🔎 Verificando: https://google.com
sla-guardian-worker  | ✅ https://google.com OK - Status: 200 - 145ms
sla-guardian-worker  | 🎉 Job 1 concluído
```

---

## 🎓 Aprendizados & Conceitos Demonstrados

✨ **Arquitetura Distribuída**

- Padrão Message Queue com BullMQ
- Desacoplamento de serviços

🔐 **TypeScript & Type Safety**

- Tipagem forte em todo o projeto
- Melhor experiência de desenvolvimento

🚀 **Resiliência**

- Retry automático
- Backoff exponencial
- Graceful shutdown

📊 **Observabilidade**

- Prometheus metrics
- Structured logging
- Health checks

🐳 **DevOps & Infrastructure**

- Docker & Docker Compose
- Multi-container orchestration
- Environment management

---

## 🤝 Como Contribuir

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 🙏 Suporte

Tem dúvidas ou encontrou um bug? Abra uma [Issue](../../issues) no GitHub!

```bash
- `REDIS_PORT` (default: 6379)
- `PORT` (API, default: 3000)
- `TARGET_URL` (default: https://google.com)

## 📊 Estrutura

```

sla-guardian/
├── api/ # Express API + Prometheus metrics
├── worker/ # BullMQ + Cron + Monitoramento
├── docker-compose.yml
└── .env.example

````

## 🛑 Parar Serviços

```bash
docker-compose down
# ou Ctrl+C nos terminais
````
