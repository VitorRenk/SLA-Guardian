# SLA Guardian

> Monitoramento de disponibilidade, métricas e alertas para serviços HTTP.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Dashboard-F46800?logo=grafana&logoColor=white)](https://grafana.com/)

## Sobre o projeto

SLA Guardian é um projeto de observabilidade construído com TypeScript, Docker, Redis, Prometheus e Grafana. Ele monitora uma URL alvo periodicamente, registra métricas reais sobre disponibilidade e tempo de resposta, e oferece uma stack completa para visualização e alertas.

O objetivo é demonstrar, de forma prática, conceitos importantes de backend e DevOps: processamento assíncrono, filas, retry com backoff, coleta de métricas, dashboards provisionados e alertas.

## O que o projeto faz

- Monitora uma URL configurável por meio da variável `TARGET_URL`.
- Executa checagens automáticas a cada 30 segundos.
- Processa verificações em background com BullMQ e Redis.
- Aplica retry automático com backoff exponencial em caso de falha.
- Expõe métricas Prometheus da API interna e do alvo monitorado.
- Disponibiliza dashboard Grafana já provisionado.
- Inclui regras de alerta no Prometheus e integração com Alertmanager.
- Suporta notificações por console, webhook e Slack.

## Arquitetura

```txt
URL monitorada
      |
      v
+------------------+      +----------------+
| Worker + BullMQ  |----->| /metrics 3002  |
| checks + retries |      +----------------+
+--------+---------+
         |
         v
+------------------+
| Redis 6379       |
| fila de jobs     |
+------------------+

+------------------+      +----------------+
| API Express 3000 |----->| /metrics 3000  |
| health + HTTP    |      +----------------+
+------------------+

+------------------+      +----------------+      +----------------+
| Prometheus 9090  |----->| Grafana 3001   |      | Alertmanager   |
| scrape metrics   |      | dashboards     |      | 9093           |
+------------------+      +----------------+      +----------------+
```

## Stack utilizada

| Camada          | Tecnologia     | Papel no projeto                       |
| --------------- | -------------- | -------------------------------------- |
| Linguagem       | TypeScript     | Código tipado na API e no worker       |
| API             | Express        | Endpoints HTTP e métricas internas     |
| Worker          | BullMQ         | Processamento assíncrono das checagens |
| Fila            | Redis          | Backend da fila de jobs                |
| Scheduler       | node-cron      | Execução periódica das verificações    |
| HTTP Client     | Axios          | Requisições para a URL monitorada      |
| Métricas        | prom-client    | Exportação de métricas Prometheus      |
| Observabilidade | Prometheus     | Coleta e consulta de métricas          |
| Dashboard       | Grafana        | Visualização das métricas              |
| Alertas         | Alertmanager   | Roteamento de notificações             |
| Infra           | Docker Compose | Orquestração local dos serviços        |

## Como executar

Pré-requisitos:

- Docker
- Docker Compose

Suba todos os serviços:

```bash
docker compose up --build
```

Após a inicialização, os containers da API, worker, Redis, Prometheus, Grafana e Alertmanager estarão disponíveis localmente.

## Serviços disponíveis

| Serviço            | URL                           | Descrição                      |
| ------------------ | ----------------------------- | ------------------------------ |
| API                | http://localhost:3000         | API interna do SLA Guardian    |
| Health check       | http://localhost:3000/health  | Verifica se a API está ativa   |
| Métricas da API    | http://localhost:3000/metrics | Métricas HTTP e Node.js da API |
| Métricas do worker | http://localhost:3002/metrics | Métricas da URL monitorada     |
| Prometheus         | http://localhost:9090         | Consulta e coleta de métricas  |
| Grafana            | http://localhost:3001         | Dashboard de observabilidade   |
| Alertmanager       | http://localhost:9093         | Gerenciamento de alertas       |
| Redis              | localhost:6379                | Fila de jobs                   |

Credenciais padrão do Grafana:

```txt
Usuário: admin
Senha: admin
```

## Configurando a URL monitorada

O worker monitora a URL definida em `TARGET_URL`. Se nenhuma URL for configurada, o valor padrão é:

```txt
https://google.com
```

Para alterar no Docker Compose, adicione a variável ao serviço `worker`:

```yaml
worker:
  environment:
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - WORKER_METRICS_PORT=3002
    - TARGET_URL=https://seu-servico.com/health
```

Depois, reinicie os containers:

```bash
docker compose up --build
```

## Métricas principais

### API interna

A API Express expõe métricas sobre o próprio SLA Guardian:

| Métrica                         | Descrição                                               |
| ------------------------------- | ------------------------------------------------------- |
| `http_requests_total`           | Total de requisições por método, rota e status          |
| `http_request_duration_seconds` | Duração das requisições HTTP                            |
| Métricas padrão Node.js         | CPU, memória, event loop, garbage collection e processo |

Essas métricas ajudam a responder se o próprio sistema de monitoramento está saudável.

### URL monitorada

O worker expõe métricas específicas sobre o alvo configurado em `TARGET_URL`:

| Métrica                               | Descrição                                 |
| ------------------------------------- | ----------------------------------------- |
| `target_up`                           | `1` se a URL respondeu, `0` se falhou     |
| `target_response_time_ms`             | Tempo da última resposta em milissegundos |
| `target_status_code`                  | Último status HTTP recebido               |
| `target_checks_total`                 | Total de checagens por resultado          |
| `target_failures_total`               | Total de falhas registradas               |
| `target_check_duration_seconds`       | Histograma de duração das checagens       |
| `target_last_check_timestamp_seconds` | Timestamp da última verificação           |

Essas métricas são coletadas pelo Prometheus e exibidas no Grafana.

## Dashboard Grafana

O projeto inclui um dashboard provisionado automaticamente com painéis para:

- Status da API.
- Uso de CPU e memória.
- Taxa de requisições.
- Latência da API.
- Taxa de sucesso e erro.
- Status da URL monitorada.
- Tempo de resposta da URL monitorada.
- Status HTTP retornado pelo alvo.
- Percentis de duração das checagens.

Também há imagens de exemplo do dashboard em:

```txt
img/cpu.PNG
img/memory.PNG
```

## Alertas

O projeto inclui regras de alerta em `prometheus-rules.yml` e configuração de roteamento no Alertmanager.

Exemplos de condições monitoradas:

- API indisponível.
- Alta taxa de erro.
- Latência elevada.
- Alto uso de CPU.
- Alto uso de memória.
- Tráfego anormal.
- Múltiplos serviços offline.

O worker também possui um sistema próprio de alertas para falhas da URL alvo:

- Alerta após 3 falhas.
- Cooldown de 5 minutos para evitar spam.
- Notificação de recuperação quando o serviço volta a responder.
- Canais disponíveis: console, webhook e Slack.

Variáveis úteis:

```env
WEBHOOK_URL=https://seu-webhook.com/alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Estrutura do projeto

```txt
sla-guardian/
|-- api/
|   `-- src/
|       `-- index.ts              # API Express e métricas Prometheus
|-- worker/
|   `-- src/
|       |-- index.ts              # Entrada do worker
|       |-- monitor.ts            # Scheduler, fila e checagem da URL alvo
|       |-- metrics.ts            # Métricas Prometheus do alvo monitorado
|       |-- alert.ts              # Controle de thresholds e cooldown
|       `-- notifications.ts      # Canais de notificação
|-- grafana-provisioning/
|   |-- datasources/              # Datasource Prometheus
|   |-- dashboards/               # Dashboard Grafana
|   `-- alertmanagers/            # Integração Grafana/Alertmanager
|-- alertmanager/
|   |-- config.yml                # Rotas de alerta
|   `-- templates.tmpl            # Template das notificações
|-- prometheus.yml                # Scrape da API e do worker
|-- prometheus-rules.yml          # Regras de alerta
`-- docker-compose.yml            # Stack completa local
```

## Por que este projeto é relevante

Este projeto demonstra habilidades práticas em áreas muito usadas em times de backend, plataforma e DevOps:

- Construção de serviços Node.js com TypeScript.
- Exposição de métricas no padrão Prometheus.
- Processamento assíncrono com filas.
- Retry e tolerância a falhas.
- Observabilidade com Prometheus e Grafana.
- Alertas com Prometheus e Alertmanager.
- Provisionamento de dashboard como código.
- Orquestração local com Docker Compose.

É um projeto pequeno o suficiente para ser entendido rapidamente, mas completo o bastante para mostrar domínio de conceitos importantes de sistemas em produção.

## Desenvolvimento local sem Docker Compose

Caso queira executar os serviços manualmente:

```bash
docker run -p 6379:6379 redis:7-alpine
```

Em outro terminal, execute a API:

```bash
cd api
npm install
npm run dev
```

Em outro terminal, execute o worker:

```bash
cd worker
npm install
npm run dev
```

Endpoints úteis:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics
curl http://localhost:3002/metrics
```
