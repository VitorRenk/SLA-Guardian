# SLA Guardian

> Monitoramento de disponibilidade, métricas, incidentes e alertas para serviços HTTP.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Metrics-E6522C?logo=prometheus&logoColor=white)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Dashboard-F46800?logo=grafana&logoColor=white)](https://grafana.com/)

## Sobre o projeto

SLA Guardian é uma stack de observabilidade construída com TypeScript, Docker, Redis, Prometheus e Grafana. O projeto monitora múltiplas URLs, registra métricas reais de disponibilidade e tempo de resposta, abre incidentes quando um serviço falha e marca esses incidentes como resolvidos quando o serviço volta.

O objetivo é demonstrar conceitos práticos de backend e DevOps: processamento assíncrono, filas, retry com backoff, persistência de incidentes, métricas Prometheus, dashboards provisionados e alertas.

## O que o projeto faz

- Monitora múltiplas URLs configuradas por `TARGET_URLS`.
- Executa checagens automáticas a cada 30 segundos.
- Processa verificações em background com BullMQ e Redis.
- Aplica retry automático com backoff exponencial em caso de falha.
- Expõe métricas Prometheus da API interna e dos alvos monitorados.
- Persiste incidentes em SQLite.
- Disponibiliza endpoints para consultar incidentes.
- Inclui dashboard Grafana provisionado.
- Inclui regras de alerta no Prometheus e integração com Alertmanager.
- Possui testes automatizados com Vitest.

## Arquitetura

```txt
TARGET_URLS
    |
    v
+------------------+      +----------------+      +----------------+
| Worker + BullMQ  |----->| /metrics 3002  |----->| Prometheus     |
| checks + retries |      | target_*       |      | 9090           |
+--------+---------+      +----------------+      +-------+--------+
         |                                               |
         v                                               v
+------------------+      +----------------+      +----------------+
| Redis 6379       |      | SQLite /data   |      | Grafana 3001   |
| fila de jobs     |      | incidentes     |      | dashboards     |
+------------------+      +--------+-------+      +----------------+
                                   ^
                                   |
+------------------+      +--------+-------+
| API Express 3000 |----->| /incidents     |
| health + metrics |      | /metrics 3000  |
+------------------+      +----------------+
```

## Stack utilizada

| Camada | Tecnologia | Papel no projeto |
| --- | --- | --- |
| Linguagem | TypeScript | Código tipado na API e no worker |
| API | Express | Health check, métricas e consulta de incidentes |
| Worker | BullMQ | Processamento assíncrono das checagens |
| Fila | Redis | Backend da fila de jobs |
| Scheduler | node-cron | Execução periódica das verificações |
| HTTP Client | Axios | Requisições para as URLs monitoradas |
| Persistência | SQLite via sql.js | Histórico de incidentes |
| Métricas | prom-client | Exportação de métricas Prometheus |
| Observabilidade | Prometheus | Coleta e consulta de métricas |
| Dashboard | Grafana | Visualização das métricas |
| Alertas | Alertmanager | Roteamento de notificações |
| Testes | Vitest | Testes automatizados |
| Infra | Docker Compose | Orquestração local dos serviços |

## Como executar

Pré-requisitos:

- Docker
- Docker Compose

Suba todos os serviços:

```bash
docker compose up --build
```

Após a inicialização, a API, worker, Redis, Prometheus, Grafana e Alertmanager estarão disponíveis localmente.

## Serviços disponíveis

| Serviço | URL | Descrição |
| --- | --- | --- |
| API | http://localhost:3000 | API interna do SLA Guardian |
| Health check | http://localhost:3000/health | Verifica se a API está ativa |
| Incidentes | http://localhost:3000/incidents | Lista histórico de incidentes |
| Incidentes abertos | http://localhost:3000/incidents/open | Lista incidentes em aberto |
| Métricas da API | http://localhost:3000/metrics | Métricas HTTP e Node.js da API |
| Métricas do worker | http://localhost:3002/metrics | Métricas das URLs monitoradas |
| Prometheus | http://localhost:9090 | Consulta e coleta de métricas |
| Grafana | http://localhost:3001 | Dashboard de observabilidade |
| Alertmanager | http://localhost:9093 | Gerenciamento de alertas |
| Redis | localhost:6379 | Fila de jobs |

Credenciais padrão do Grafana:

```txt
Usuário: admin
Senha: admin
```

## Configurando URLs monitoradas

O worker lê a variável `TARGET_URLS`, separada por vírgula:

```yaml
worker:
  environment:
    - TARGET_URLS=https://www.google.com,http://localhost:9999
```

Também existe compatibilidade com `TARGET_URL` para um único alvo. Se nenhuma variável for definida, o worker usa:

```txt
https://google.com
```

Depois de alterar as URLs, recrie o worker:

```bash
docker compose up -d --force-recreate worker
```

## Incidentes

Quando uma URL falha, o worker cria ou atualiza um incidente aberto em SQLite. Quando a URL volta a responder, o incidente é marcado como resolvido.

Endpoints disponíveis:

```txt
GET /incidents
GET /incidents/open
GET /incidents/:id
```

Formato resumido de um incidente:

```json
{
  "id": 1,
  "service_url": "http://localhost:9999",
  "status": "open",
  "error_message": "connect ECONNREFUSED",
  "failure_count": 3,
  "started_at": "2026-01-01T00:00:00.000Z",
  "last_failure_at": "2026-01-01T00:01:00.000Z",
  "resolved_at": null,
  "last_duration_ms": 12
}
```

O banco fica em `/data/sla-guardian.db` dentro dos containers e é persistido no volume Docker `incident-data`.

## Métricas principais

### API interna

| Métrica | Descrição |
| --- | --- |
| `http_requests_total` | Total de requisições por método, rota e status |
| `http_request_duration_seconds` | Duração das requisições HTTP |
| Métricas padrão Node.js | CPU, memória, event loop, garbage collection e processo |

### URLs monitoradas

| Métrica | Descrição |
| --- | --- |
| `target_up` | `1` se a URL respondeu, `0` se falhou |
| `target_response_time_ms` | Tempo da última resposta em milissegundos |
| `target_status_code` | Último status HTTP recebido |
| `target_checks_total` | Total de checagens por resultado |
| `target_failures_total` | Total de falhas registradas |
| `target_check_duration_seconds` | Histograma de duração das checagens |
| `target_last_check_timestamp_seconds` | Timestamp da última verificação |

### Incidentes

| Métrica | Descrição |
| --- | --- |
| `incidents_open_total` | Quantidade atual de incidentes abertos |
| `incidents_recorded_total` | Total de incidentes criados |
| `incidents_resolved_total` | Total de incidentes resolvidos |

## Dashboard Grafana

O dashboard provisionado mostra:

- Status da API.
- Uso de CPU e memória.
- Taxa de requisições.
- Latência da API.
- Taxa de sucesso e erro.
- Status das URLs monitoradas por `target_url`.
- Tempo de resposta dos alvos.
- Status HTTP retornado pelos alvos.
- Percentis de duração das checagens.

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

O worker também possui alertas próprios para falhas dos alvos:

- Alerta após 3 falhas.
- Cooldown de 5 minutos para evitar spam.
- Notificação de recuperação quando o serviço volta a responder.
- Canais disponíveis: console, webhook e Slack.

## Testes

Rodar testes da API:

```bash
cd api
npm test
```

Rodar testes do worker:

```bash
cd worker
npm test
```

Os testes cobrem:

- Health check e métricas da API.
- Endpoints de incidentes.
- Parsing de `TARGET_URLS`.
- Checagens HTTP com sucesso e falha.
- Abertura, atualização e resolução de incidentes.

## Estrutura do projeto

```txt
sla-guardian/
|-- api/
|   `-- src/
|       |-- app.ts                # Express app testável
|       |-- index.ts              # Inicialização da API
|       `-- incidents.ts          # Leitura dos incidentes SQLite
|-- worker/
|   `-- src/
|       |-- config.ts             # Parsing de TARGET_URLS e DB_PATH
|       |-- index.ts              # Entrada do worker
|       |-- monitor.ts            # Scheduler, fila e checagens
|       |-- incidents.ts          # Escrita e resolução de incidentes
|       |-- metrics.ts            # Métricas Prometheus
|       |-- alert.ts              # Thresholds e cooldown
|       `-- notifications.ts      # Canais de notificação
|-- grafana-provisioning/
|-- alertmanager/
|-- prometheus.yml
|-- prometheus-rules.yml
`-- docker-compose.yml
```

## Por que este projeto é relevante

Este projeto demonstra habilidades práticas em áreas usadas em backend, plataforma e DevOps:

- Serviços Node.js com TypeScript.
- Processamento assíncrono com filas.
- Monitoramento de múltiplos serviços.
- Retry e tolerância a falhas.
- Persistência de histórico de incidentes.
- Métricas no padrão Prometheus.
- Dashboard Grafana provisionado.
- Alertas com Prometheus e Alertmanager.
- Testes automatizados.
- Orquestração com Docker Compose.
