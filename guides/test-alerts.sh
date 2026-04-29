#!/bin/bash

# 🧪 Script de Teste - Sistema de Alertas SLA Guardian

echo "🔔 Iniciando testes do sistema de alertas..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check Docker
echo -e "${BLUE}[Test 1]${NC} Verificando Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker instalado"
else
    echo -e "${RED}✗${NC} Docker não encontrado"
    exit 1
fi

# Test 2: Check dependencies
echo ""
echo -e "${BLUE}[Test 2]${NC} Verificando dependências..."
cd worker
if npm list bullmq &> /dev/null; then
    echo -e "${GREEN}✓${NC} BullMQ instalado"
else
    echo -e "${YELLOW}⚠${NC} BullMQ não instalado, instalando..."
    npm install
fi
cd ..

# Test 3: Build Docker images
echo ""
echo -e "${BLUE}[Test 3]${NC} Compilando imagens Docker..."
docker-compose build 2>&1 | grep -E "Successfully|error" && echo -e "${GREEN}✓${NC} Build concluído" || echo -e "${RED}✗${NC} Erro no build"

# Test 4: Start services
echo ""
echo -e "${BLUE}[Test 4]${NC} Iniciando serviços..."
docker-compose up -d

# Wait for services to be ready
sleep 5

# Test 5: Check if services are running
echo ""
echo -e "${BLUE}[Test 5]${NC} Verificando serviços em execução..."
if docker ps | grep -q "sla-guardian-api"; then
    echo -e "${GREEN}✓${NC} API rodando em http://localhost:3000"
else
    echo -e "${RED}✗${NC} API não está rodando"
fi

if docker ps | grep -q "sla-guardian-worker"; then
    echo -e "${GREEN}✓${NC} Worker rodando"
else
    echo -e "${RED}✗${NC} Worker não está rodando"
fi

if docker ps | grep -q "sla-guardian-redis"; then
    echo -e "${GREEN}✓${NC} Redis rodando em localhost:6379"
else
    echo -e "${RED}✗${NC} Redis não está rodando"
fi

# Test 6: Test API endpoints
echo ""
echo -e "${BLUE}[Test 6]${NC} Testando endpoints API..."
HEALTH=$(curl -s http://localhost:3000/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC} GET /health respondendo"
else
    echo -e "${RED}✗${NC} GET /health falhou"
fi

# Test 7: Check Prometheus metrics
echo ""
echo -e "${BLUE}[Test 7]${NC} Verificando métricas Prometheus..."
METRICS=$(curl -s http://localhost:3000/metrics)
if echo "$METRICS" | grep -q "process_cpu"; then
    echo -e "${GREEN}✓${NC} Métricas Prometheus disponíveis"
else
    echo -e "${RED}✗${NC} Métricas não encontradas"
fi

# Test 8: Monitor for alerts
echo ""
echo -e "${BLUE}[Test 8]${NC} Aguardando primeiro ciclo de monitoramento..."
echo "⏳ Aguarde ~30 segundos para ver os alertas..."
echo ""

# Show worker logs
docker logs -f sla-guardian-worker &
LOGS_PID=$!

# Wait for alerts
sleep 35

# Kill log process
kill $LOGS_PID 2>/dev/null

echo ""
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "📊 Status dos serviços:"
docker-compose ps

echo ""
echo "📝 Para parar os serviços:"
echo "  docker-compose down"
echo ""
echo "📺 Para ver logs em tempo real:"
echo "  docker logs -f sla-guardian-worker"
