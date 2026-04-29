# 🔔 Referência Rápida: Sistema de Alertas

## Ativar Canais de Alerta

Edite `worker/.env` e configure:

### Console (Padrão - sempre ativo)

```env
# Nenhuma configuração necessária
# Alertas aparecem no terminal
```

### Webhook HTTP

```env
WEBHOOK_URL=https://seu-servidor.com/api/alerts
```

### Slack

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Email

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password
ALERT_EMAIL=admin@example.com
```

---

## Como Funciona

```
[Serviço Falha]
     ↓
[Contador +1]
     ↓
Falha 1-2? → Log apenas ⚠️
     ↓
Falha 3? → 🔔 ALERTA
     ↓
[Notificações enviadas para todos os canais]
     ↓
[Cooldown: 5 minutos sem repetir alerta]
     ↓
[Serviço Recupera?] → ✅ Alerta de recuperação
```

---

## Testar Alertas

### Simular Falha

```bash
# Edite worker/.env
TARGET_URL=https://invalid-domain-test-12345.com

# Reinicie
docker-compose down
docker-compose up --build

# Aguarde ~90 segundos para 3 falhas
```

### Ver Logs em Tempo Real

```bash
docker logs -f sla-guardian-worker
```

---

## Arquivos Novos

```
worker/src/
  ├── alert.ts           # 🔔 Alert Manager
  ├── notifications.ts   # 📮 Canais de notificação
  ├── types.ts           # 📋 Type definitions
  └── monitor.ts         # ✅ Integração de alertas

guides/
  ├── alerts-setup.md    # 📖 Guia completo
  └── test-alerts.sh     # 🧪 Script de testes
```

---

## Canais Disponíveis

| Canal   | Status      | Configuração        | Uso                        |
| ------- | ----------- | ------------------- | -------------------------- |
| Console | ✅ Padrão   | -                   | Desenvolvimento            |
| Webhook | ✅ Opcional | `WEBHOOK_URL`       | Integração custom          |
| Slack   | ✅ Opcional | `SLACK_WEBHOOK_URL` | Notificações em tempo real |
| Email   | ✅ Opcional | `SMTP_*`            | Alertas críticos           |

---

## Lógica Inteligente

- ✅ **Threshold**: 3 falhas antes de alertar
- ✅ **Cooldown**: 5 minutos entre alertas do mesmo serviço
- ✅ **Recuperação**: Auto-notificação quando volta a funcionar
- ✅ **Context**: Inclui erro, tentativas, duração

---

## Próximas Melhorias

- [ ] Dashboard de alertas
- [ ] Histórico de alertas no banco de dados
- [ ] Integração com PagerDuty/Opsgenie
- [ ] Testes unitários
- [ ] CI/CD automático

---

## Suporte

Para dúvidas, consulte:

- [Guia Completo](./alerts-setup.md)
- [README Principal](../README.md)
- [Código-fonte](../worker/src/)
