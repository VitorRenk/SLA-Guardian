#!/bin/bash

# 🔔 Script para Testar Alertas do SLA Guardian
# Este script simula diferentes cenários de alerta

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔔 SLA Guardian - Teste de Alertas${NC}"
echo "====================================="
echo ""

# URLs dos serviços
GRAFANA_URL="http://localhost:3001"
PROMETHEUS_URL="http://localhost:9090"
ALERTMANAGER_URL="http://localhost:9093"
API_URL="http://localhost:3000"

# Função para verificar se serviço está online
check_service() {
  local url=$1
  local name=$2
  
  if curl -s "$url" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ $name está rodando${NC}"
    return 0
  else
    echo -e "${RED}❌ $name não está acessível ($url)${NC}"
    return 1
  fi
}

echo -e "${BLUE}📋 Verificando serviços...${NC}"
echo ""

check_service "$PROMETHEUS_URL" "Prometheus" || exit 1
check_service "$ALERTMANAGER_URL" "Alertmanager" || exit 1
check_service "$GRAFANA_URL" "Grafana" || exit 1
check_service "$API_URL" "API" || exit 1

echo ""
echo -e "${BLUE}📊 Status Atual dos Alertas${NC}"
echo "============================"
echo ""

# Verificar alertas ativos
echo -e "${YELLOW}Alertas Ativos:${NC}"
curl -s "$PROMETHEUS_URL/api/v1/alerts" | jq '.data.alerts[] | {alert: .labels.alertname, severity: .labels.severity, state: .state}' 2>/dev/null || echo "Nenhum alerta ativo"

echo ""
echo -e "${YELLOW}Alertas em Grupos:${NC}"
curl -s "$ALERTMANAGER_URL/api/v1/alerts/groups" | jq '.' 2>/dev/null || echo "Nenhum alerta"

echo ""
echo -e "${BLUE}🧪 Testes Disponíveis${NC}"
echo "======================="
echo ""

echo "1. Testar Alerta: API Indisponível"
echo "   Comando: docker-compose stop api"
echo "   Esperar: 2+ minutos para alerta disparar"
echo ""

echo "2. Testar Alerta: Alta Taxa de Erro"
echo "   Comando: while true; do curl http://localhost:3000/error; done"
echo ""

echo "3. Testar Alerta: Alta Latência"
echo "   Comando: docker exec sla-guardian-api node -e \"setInterval(() => {}, 2000)\""
echo ""

echo "4. Testar Alerta: Alta Memória"
echo "   Comando: docker exec sla-guardian-api node -e \"const arr = []; setInterval(() => { arr.push(new Array(1000000)); }, 100)\""
echo ""

echo "5. Testar Silenciamento de Alertas"
echo "   URL: $ALERTMANAGER_URL"
echo "   Ir para: Silences → New Silence"
echo ""

echo -e "${BLUE}🔍 Acessar Interfaces de Alerta${NC}"
echo "================================="
echo ""

echo -e "${YELLOW}Prometheus:${NC}"
echo "  Alertas: $PROMETHEUS_URL/alerts"
echo "  Regras: $PROMETHEUS_URL/rules"
echo "  Targets: $PROMETHEUS_URL/targets"
echo ""

echo -e "${YELLOW}Alertmanager:${NC}"
echo "  Dashboard: $ALERTMANAGER_URL"
echo "  API: $ALERTMANAGER_URL/api/v1/alerts"
echo "  Silences: $ALERTMANAGER_URL/#/silences"
echo ""

echo -e "${YELLOW}Grafana:${NC}"
echo "  Dashboard: $GRAFANA_URL (admin/admin)"
echo "  Alertas: $GRAFANA_URL/alerting/list"
echo "  Contact Points: $GRAFANA_URL/alerting/notifications"
echo ""

echo -e "${BLUE}📝 Exemplo de Requisição Manual${NC}"
echo "=================================="
echo ""

echo "Testar webhook customizado:"
echo ""
echo "curl -X POST http://localhost:3000/api/test-alert \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"alert\": \"test\", \"severity\": \"warning\"}'"
echo ""

echo -e "${BLUE}📊 Queries PromQL Úteis${NC}"
echo "========================"
echo ""

echo "1. Status de cada alerta:"
echo "   ALERTS{alertname=~\".*\"}"
echo ""

echo "2. Alertas ativos por severidade:"
echo "   count(ALERTS) by (severity)"
echo ""

echo "3. Alertas disparados nos últimos 5 minutos:"
echo "   changes(ALERTS[5m]) > 0"
echo ""

echo "4. Taxa de erro (%):"
echo "   (sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))) * 100"
echo ""

echo "5. Latência P95:"
echo "   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
echo ""

echo -e "${BLUE}🔧 Troubleshooting${NC}"
echo "==================="
echo ""

echo "Se alertas não estão funcionando:"
echo ""

echo "1. Verificar logs do Alertmanager:"
echo "   docker logs sla-guardian-alertmanager -f"
echo ""

echo "2. Verificar logs do Prometheus:"
echo "   docker logs sla-guardian-prometheus -f"
echo ""

echo "3. Verificar configuração do Alertmanager:"
echo "   curl $ALERTMANAGER_URL/api/v1/alerts"
echo ""

echo "4. Verificar se regras foram carregadas:"
echo "   curl $PROMETHEUS_URL/api/v1/rules"
echo ""

echo "5. Testar webhook manualmente:"
echo "   curl -X POST https://seu-webhook.com -d '{\"test\": \"alert\"}'"
echo ""

echo -e "${BLUE}📚 Documentação${NC}"
echo "==============="
echo ""
echo "Guia completo: guides/ALERTS_GRAFANA.md"
echo ""

echo -e "${GREEN}✅ Setup de testes de alerta concluído!${NC}"
