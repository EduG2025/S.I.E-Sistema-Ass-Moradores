
# 🏛️ ESQUEMA DE DADOS S.I.E PRO (V180.0)

Documentação oficial da arquitetura de dados do Kernel S.I.E sob o padrão **SRE Standardized**.

---

## 🏗️ 1. MÓDULOS NUCLEARES

### `settings` (O Cérebro Master)
Configurações globais do cluster. Existe apenas um registro (`id: 1`).
- `whatsapp_config`: **(JSON)** Chaves de integração com JennyAI.
- `resident_ui_settings`: **(JSON)** Manifest de controle da interface dos moradores.

### `users` (Entidades & Permissões)
Gerencia todos os membros do cluster.
- `socialData`: **(JSON)** Metadados demográficos alimentados via Censo.
- `coordinates`: **(JSON)** Latitude e Longitude para geoprocessamento no SmartMap.

---

## 📊 2. INTELIGÊNCIA & AUDITORIA

### `audit_logs` (Integridade SRE)
Registra todas as mutações de dados no sistema (POST/PUT/DELETE).
- Utilizado para alimentar a aba **Compliance** do módulo Financeiro.
- Garante o rastreio de ações administrativas (Quem, Onde, Quando).

### `ai_keys` (Failover Neural)
Pool de chaves para os modelos Gemini.
- O sistema rotaciona chaves automaticamente em caso de `Resource Exhausted` (429).

---

## 📢 3. COMUNICAÇÃO ATIVA

### `notices` (Mural)
Comunicados oficiais visíveis para todos ou segmentados.

### `whatsapp_broadcast_logs`
Histórico de disparos massivos realizados via JennyAI Bridge.
- Rastreia o status de envio em tempo real (QUEUED -> COMPLETED).

---
**Status da Documentação:** 🟢 ATUALIZADA & HOMOLOGADA V180.0
