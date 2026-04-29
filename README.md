# 🚀 SLA Guardian - Quick Start Guide

## ✅ Pré-requisitos

- Docker & Docker Compose instalados
- Node.js 20+
- npm 10+

## 📦 Instalação e Teste

### 1. Instalar dependências

```bash
npm install
cd api && npm install && cd ..
cd worker && npm install && cd ..
```

### 2. Iniciar com Docker Compose

```bash
docker-compose up --build
```

Isso vai:

- 🐳 Subir Redis em `localhost:6379`
- 🔵 Subir API em `http://localhost:3000`
- 👷 Subir Worker para monitoramento

### 3. Testar a API

#### Health Check

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{ "status": "ok" }
```

#### Endpoint raiz

```bash
curl http://localhost:3000/
```

Resposta esperada:

```json
{ "message": "SLA Guardian API running 🚀" }
```

#### Métricas Prometheus

```bash
curl http://localhost:3000/metrics
```

### 4. Verificar Worker

O worker vai imprimir no console:

```
⏱️ Enviando job de monitoramento...
🔎 Verificando: https://google.com
✅ https://google.com OK - Status: 200 - 150ms
🎉 Job XXX concluído
```

## 🧪 Teste Rápido (sem Docker)

### Terminal 1 - Redis

```bash
docker run -p 6379:6379 redis:7-alpine
```

### Terminal 2 - API

```bash
cd api
npm run dev
```

### Terminal 3 - Worker

```bash
cd worker
npm run dev
```

## 🔧 Configuração

Edite `.env` nos diretórios `api/` e `worker/` para alterar:

- `REDIS_HOST` (default: redis)
- `REDIS_PORT` (default: 6379)
- `PORT` (API, default: 3000)
- `TARGET_URL` (default: https://google.com)

## 📊 Estrutura

```
sla-guardian/
├── api/              # Express API + Prometheus metrics
├── worker/           # BullMQ + Cron + Monitoramento
├── docker-compose.yml
└── .env.example
```

## 🛑 Parar Serviços

```bash
docker-compose down
# ou Ctrl+C nos terminais
```
