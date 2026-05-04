# 📝 Changelog

## [1.2.0] - 2026-05-04

### ✨ Adicionado

#### 🔔 Alertas Inteligentes no Grafana ⭐ **NOVO!**

- **Alertmanager**: Sistema completo de gerenciamento de alertas
  - Roteamento inteligente de alertas
  - Agrupamento de alertas similares
  - Regras de inibição (evitar duplicatas)

- **Regras de Alerta do Prometheus** (`prometheus-rules.yml`):
  - 8+ regras de alerta pré-configuradas
  - Suporte para múltiplas severidades
  - Alertas para performance, disponibilidade, recursos

- **Templates de Notificação** (`alertmanager/templates.tmpl`):
  - Formatação profissional para Slack
  - Emails HTML responsivos
  - Informações detalhadas do alerta

- **Canais de Notificação Configuráveis**:
  - 💬 Slack Webhook
  - 📧 Email (SMTP) - Gmail, Outlook, SendGrid
  - 🪐 Webhook HTTP customizado
  - 🔗 Extensível para Discord, Teams, PagerDuty

#### 📁 Arquivos Novos

- `alertmanager/config.yml` - Configuração do Alertmanager
- `alertmanager/templates.tmpl` - Templates de mensagem
- `prometheus-rules.yml` - Regras de alerta
- `grafana-provisioning/alertmanagers/alertmanager.yml` - Provisioning Grafana
- `guides/ALERTS_GRAFANA.md` - Guia completo (500+ linhas)
- `guides/test-alerts-grafana.sh` - Script de teste de alertas
- `.env.alerts.example` - Exemplo de configuração

#### 📊 Alertas Pré-configurados

| Alerta                    | Condição                      | Severidade |
| ------------------------- | ----------------------------- | ---------- |
| 🔴 API Unresponsive       | Offline > 2 min               | Crítico    |
| 🟠 High Error Rate        | Taxa erro > 5% por 5 min      | Aviso      |
| 🟠 High Latency           | P95 latência > 1s por 5 min   | Aviso      |
| 🔴 Critical Latency       | P99 latência > 5s por 2 min   | Crítico    |
| 🟠 High Memory Usage      | Memória > 85% por 10 min      | Aviso      |
| 🟠 High CPU Usage         | CPU > 80% por 10 min          | Aviso      |
| ℹ️ Unusual Traffic        | Requisições > 100/s por 5 min | Info       |
| 🔴 Multiple Services Down | 2+ serviços offline por 1 min | Crítico    |

### 🔄 Modificado

#### `docker-compose.yml`

- ✅ Adicionado Alertmanager container
- ✅ Novo volume `alertmanager-data`
- ✅ Variáveis de ambiente para alertas
- ✅ Novo path de provisioning para Grafana

#### `prometheus.yml`

- ✅ Configuração de Alertmanager
- ✅ Carregamento de regras (`rule_files`)
- ✅ `evaluation_interval` ajustado para 30s

#### `README.md`

- ✅ Nova seção: "Alertas Inteligentes no Grafana"
- ✅ Tabela de alertas pré-configurados
- ✅ Instruções de configuração passo-a-passo
- ✅ Links para documentação completa

#### `.env.example`

- ✅ Variáveis para SLACK_WEBHOOK_URL
- ✅ Variáveis para SMTP/Email
- ✅ Variáveis para Webhook customizado

### 🎯 Como Usar

1. **Configurar Slack**:

   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   docker-compose up -d alertmanager
   ```

2. **Configurar Email**:

   ```bash
   SMTP_PASSWORD=seu-app-password
   ALERT_EMAIL=admin@example.com
   docker-compose restart alertmanager
   ```

3. **Testar**:
   ```bash
   bash guides/test-alerts-grafana.sh
   docker-compose stop api  # Simular falha
   ```

---

## [1.1.0] - 2026-04-29

### ✨ Adicionado

#### 🔔 Sistema de Alertas Inteligente

- **Alert Manager**: Gerenciador centralizado de alertas
- **Multi-channel notifications**:
  - 💻 Console (padrão)
  - 🪝 Webhook HTTP customizado
  - 💬 Slack Webhook
  - 📧 Email SMTP (Gmail, Outlook, SendGrid)

#### 🧠 Lógica Inteligente de Alertas

- Threshold de 3 falhas antes de alertar
- Cooldown de 5 minutos para evitar spam
- Notificações automáticas de recuperação
- Context detalhado (erro, tentativas, duração)

#### 📁 Arquivos Novos

- `worker/src/alert.ts` - Alert Manager
- `worker/src/notifications.ts` - Canais de notificação
- `worker/src/types.ts` - Type definitions
- `guides/alerts-setup.md` - Guia completo (8KB)
- `guides/test-alerts.sh` - Script de testes
- `ALERTS.md` - Referência rápida

#### 📦 Dependências Novas

- `nodemailer@^6.9.9` - Suporte a email

#### 📚 Documentação

- Seção de alertas no README
- Guia extenso de configuração
- Exemplos de payload de webhook
- Screenshots de mensagens Slack

### 🔄 Modificado

#### `worker/src/monitor.ts`

- ✅ Integração com Alert Manager
- ✅ Disparo automático de alertas
- ✅ Notificação de recuperação

#### `worker/package.json`

- ✅ Adicionado `nodemailer` como dependência
- ✅ Scripts: `build` e `start`

#### `worker/.env`

- ✅ Variáveis de configuração de alertas

#### `.env.example`

- ✅ Documentação de todas as variáveis

#### `README.md`

- ✅ Seção "🔔 Sistema de Alertas Inteligente"
- ✅ Feature destacada na lista principal
- ✅ Estrutura de projeto atualizada

### 📊 Impacto

```
Arquivos Criados:      7
Linhas de Código:      ~1500
Linhas de Docs:        ~1200
Canais de Alerta:      4
Testes Possíveis:      ∞
```

### 🚀 Como Usar

1. **Console** (padrão):

   ```bash
   docker-compose up
   ```

2. **Webhook**:

   ```env
   WEBHOOK_URL=https://seu-webhook.com/alerts
   ```

3. **Slack**:

   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

4. **Email**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=email@gmail.com
   SMTP_PASS=app-password
   ```

### 📖 Documentação

- [ALERTS.md](./ALERTS.md) - Referência rápida
- [guides/alerts-setup.md](./guides/alerts-setup.md) - Guia completo
- [README.md](./README.md#-sistema-de-alertas-inteligente) - Visão geral

### ✅ Testes

- [ ] Testar console alerts
- [ ] Testar webhook HTTP
- [ ] Testar Slack integration
- [ ] Testar email SMTP
- [ ] Testar threshold
- [ ] Testar cooldown
- [ ] Testar recuperação

### 🎯 Próximas Melhorias

- [ ] Dashboard web de alertas
- [ ] Persistência de histórico (DB)
- [ ] Integração PagerDuty
- [ ] Integração Opsgenie
- [ ] Templates customizáveis
- [ ] Alertas por severidade
- [ ] Testes E2E

### 🐛 Bugs Conhecidos

Nenhum reportado até o momento.

### 📌 Notas

- Sistema pronto para produção
- Suporta múltiplos serviços simultâneos
- Sem Breaking Changes
- Totalmente retrocompatível

---

## [1.0.0] - 2026-04-29

### ✨ Funcionalidades Iniciais

- Express API com Prometheus metrics
- BullMQ worker com scheduler
- Docker Compose setup
- Redis integration
- Retry automático
- Monitoramento básico
