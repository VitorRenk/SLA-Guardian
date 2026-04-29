# 🔔 Guia Completo: Sistema de Alertas

## 📋 Índice

- [Console](#console)
- [Webhook Genérico](#webhook-genérico)
- [Slack](#slack)
- [Email](#email)
- [Testando Alertas](#testando-alertas)

---

## 💻 Console

O canal console é ativado **automaticamente** e exibe alertas no terminal do worker.

### Exemplo de saída:

```bash
┌─────────────────────────────────────────────────────────┐
│ ❌ ALERTA DE MONITORAMENTO
├─────────────────────────────────────────────────────────┤
│ Serviço:     https://api.exemplo.com
│ Status:      FAILURE
│ Mensagem:    Falha ao verificar serviço
│ Tempo:       29/04/2026 14:35:22
│ Erro:        connect ECONNREFUSED 192.168.1.1:443
│ Tentativas:  3/5
│ Duração:     5000ms
└─────────────────────────────────────────────────────────┘
```

### Quando é acionado:

- ✅ Qualquer falha de conexão
- ✅ Após 3 falhas consecutivas
- ✅ Quando o serviço se recupera

---

## 🪝 Webhook Genérico

### 1. Configuração

Adicione ao `.env` (worker):

```env
WEBHOOK_URL=https://seu-servidor.com/api/alerts
```

### 2. Payload Enviado

O sistema faz um POST HTTP para a URL configurada:

```bash
POST https://seu-servidor.com/api/alerts HTTP/1.1
Content-Type: application/json

{
  "alert": {
    "service": "https://google.com",
    "status": "failure",
    "message": "Falha ao verificar serviço: https://google.com",
    "error": "timeout of 5000ms exceeded",
    "duration": 5000,
    "retries": {
      "current": 3,
      "max": 5
    },
    "timestamp": "2026-04-29T14:35:22.345Z"
  },
  "metadata": {
    "project": "SLA Guardian",
    "environment": "production",
    "version": "1.0.0"
  }
}
```

### 3. Implementar seu Webhook

**Node.js/Express example:**

```javascript
app.post("/api/alerts", (req, res) => {
  const { alert, metadata } = req.body;

  console.log(`🔔 [${metadata.project}] ${alert.status.toUpperCase()}`);
  console.log(`   Serviço: ${alert.service}`);
  console.log(`   Erro: ${alert.error}`);

  // Salvar em banco de dados, enviar para Datadog, etc

  res.status(200).json({ received: true });
});
```

### 4. Testar Localmente

Use ngrok para expor sua aplicação local:

```bash
ngrok http 3000
```

Configure no `.env`:

```env
WEBHOOK_URL=https://seu-ngrok-url.ngrok.io/api/alerts
```

---

## 💬 Slack

### 1. Criar uma App Slack

1. Acesse https://api.slack.com/apps
2. Clique em "Create New App" > "From scratch"
3. Nome: "SLA Guardian"
4. Selecione seu workspace

### 2. Configurar Incoming Webhooks

1. Na barra lateral, clique em "Incoming Webhooks"
2. Ative o toggle "Incoming Webhooks"
3. Clique em "Add New Webhook to Workspace"
4. Selecione o canal (ex: #alerts, #monitoring)
5. Clique em "Allow"
6. **Copie a URL do webhook**

### 3. Configurar no .env

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 4. Exemplo de Mensagem Slack

O sistema envia uma mensagem formatada no Slack:

```
[Attachment]
Cor: 🔴 Red (failure) | 🟢 Green (recovered) | 🟡 Yellow (degraded)

Título: SLA Guardian - FAILURE

Fields:
  Serviço: https://api.exemplo.com
  Status: failure
  Mensagem: Falha ao verificar serviço: https://api.exemplo.com
  Erro: connect ECONNREFUSED
  Duração: 5000ms

Footer: SLA Guardian
Timestamp: 2026-04-29T14:35:22Z
```

### 5. Testar

Simule uma falha:

```bash
# No arquivo .env, altere TARGET_URL para uma URL inválida
TARGET_URL=https://invalid-domain-12345.com
```

Aguarde 3 falhas consecutivas e veja a notificação no Slack!

---

## 📧 Email

### 1. Configuração Gmail

**Opção A: Ativar "Menos seguro"**

1. Acesse https://myaccount.google.com/security
2. Ative "Acesso a apps menos seguro"
3. Use sua senha normal no `.env`

**Opção B: App Password (Recomendado)**

1. Acesse https://myaccount.google.com/apppasswords
2. Selecione "Mail" e "Windows Computer"
3. Gere a app password
4. **Copie a senha gerada** (sem espaços)

### 2. Configurar no .env

```env
# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-app-password-16-caracteres
SMTP_FROM=seu-email@gmail.com
ALERT_EMAIL=admin@example.com

# OU Outlook
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha

# OU SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxx...
```

### 3. Exemplo de Email Recebido

```
Subject: ❌ SLA Alert: https://api.exemplo.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 Alerta SLA Guardian
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Serviço: https://api.exemplo.com
Status: FAILURE
Mensagem: Falha ao verificar serviço
Erro: timeout of 5000ms exceeded
Duração: 5000ms
Data/Hora: 29/04/2026 14:35:22

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLA Guardian v1.0.0
```

### 4. Testar Envio de Email

```bash
# Altere TARGET_URL para URL inválida para simular falha
# Aguarde 3 falhas e verifique seu email
```

---

## 🧪 Testando Alertas

### Teste Manual 1: Console

```bash
cd worker
npm run dev

# Esperar 30s para primeiro check
# Verá logs no console
```

### Teste Manual 2: Webhook

Abra outro terminal:

```bash
# Simular webhook server
npx json-server --watch db.json --port 4000
```

No `.env`:

```env
WEBHOOK_URL=http://localhost:4000/alerts
```

### Teste Manual 3: Slack

1. Configure `SLACK_WEBHOOK_URL` no `.env`
2. Altere `TARGET_URL=https://invalid-url.test`
3. Aguarde 3 falhas (≈ 90 segundos)
4. Verifique o canal Slack

### Teste Manual 4: Email

1. Configure SMTP no `.env`
2. Altere `TARGET_URL=https://invalid-url.test`
3. Aguarde 3 falhas
4. Verifique sua caixa de entrada

---

## ⚙️ Lógica de Alertas

### Threshold

```
Falha 1 → ⚠️ Log apenas
Falha 2 → ⚠️ Log apenas
Falha 3 → 🔔 ALERTA! (todos os canais)
```

### Cooldown (5 minutos)

```
14:00 → Alerta enviado
14:01 → Falha novamente (cooldown, sem alerta)
14:05 → Falha novamente (cooldown expirou, envia alerta)
```

### Recuperação

```
Falhas consecutivas → 🔔 ALERTA
Sucesso no check → ✅ Mensagem de recuperação
```

---

## 🔧 Troubleshooting

### Webhook não está funcionando

- [ ] Verifique se `WEBHOOK_URL` está configurado
- [ ] Verifique firewall/CORS
- [ ] Veja logs: `docker logs sla-guardian-worker`
- [ ] Teste com `curl -X POST WEBHOOK_URL`

### Slack não recebe mensagens

- [ ] Verifique webhook URL (copie novamente de api.slack.com)
- [ ] Confirme que o canal é público ou bot tem acesso
- [ ] Veja logs: `docker logs sla-guardian-worker`

### Email não está chegando

- [ ] Verifique se SMTP está habilitado
- [ ] Cheque spam/lixo eletrônico
- [ ] Teste com gmail app password
- [ ] Veja logs: `docker logs sla-guardian-worker`

### "AlertManager não está disparando"

- [ ] Verificar se threshold foi atingido (3 falhas)
- [ ] Verificar se cooldown expirou
- [ ] Logs devem indicar: "⚠️ Alha X/3"

---

## 📊 Status de Alertas

Verifique o status dos alertas via endpoint:

```bash
curl http://localhost:3000/status  # (futuro)
```

Saída:

```json
{
  "alerts": [
    {
      "service": "https://google.com",
      "failures": 0,
      "lastAlert": "2026-04-29T14:35:22Z"
    }
  ]
}
```

---

## 🎯 Boas Práticas

✅ **Use múltiplos canais** - console + webhook + slack
✅ **Teste cada canal** antes de colocar em produção
✅ **Customize o threshold** conforme sua SLA
✅ **Monitore os logs** para debug
✅ **Guarde o cooldown sensato** (5 min padrão)
✅ **Use app passwords** para Gmail (mais seguro)

---

## 📚 Referências

- [Slack API Webhooks](https://api.slack.com/messaging/webhooks)
- [Nodemailer SMTP Docs](https://nodemailer.com/smtp/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [ngrok Documentation](https://ngrok.com/docs)
