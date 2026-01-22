# 🏛️ ESQUEMA DE DADOS S.I.E PRO (V260.0)

Documentação oficial da arquitetura de persistência do Kernel S.I.E PRO.

## 🏗️ 1. CONFIGURAÇÕES & CORE

### `settings`
Registro único (ID: 1) de controle do sistema.
- `id`: PK (1)
- `name`: Nome da Entidade.
- `shortName`: Sigla/Identidade Curta.
- `cnpj`: Documento Fiscal.
- `address`, `email`, `phone`, `website`: Dados de contato.
- `primaryColor`: Identidade Visual (Hex).
- `registrationMode`: `OPEN`, `APPROVAL`, `INVITE_ONLY`.
- `logoUrl`: LONGTEXT (Base64).
- `resident_ui_settings`: JSON (Ativação/Desativação de módulos para moradores).
- `whatsapp_config`: JSON (`api_key`, `sender`, `footer`, `welcome_template`, `default_password`).

### `roles` & `role_permissions`
Gestão de RBAC Dinâmico.
- `roles`: `id` (ID do cargo), `label` (Nome legível).
- `role_permissions`: `role` (FK), `permission_id` (String de permissão).

---

## 👥 2. IDENTIDADE & SOCIAL

### `users`
Membros e identidades do cluster.
- `name`, `cpf_cnpj`, `email`, `password_hash`.
- `role`: Referência à tabela `roles`.
- `unit`: Unidade habitacional ou administrativa.
- `age`: Atributo biográfico para análise de pirâmide etária.
- `socialData`: JSON (Metadados de vulnerabilidade, tags, histórico social).
- `coordinates`: JSON (`lat`, `lng` para SmartMap).
- `active`: TINYINT (Status de rede).

### `surveys` & `survey_responses`
Motor de Censo Neural.
- `surveys`: `title`, `description`, `type` (CENSUS/AID), `questions` (JSON Schema), `status`.
- `survey_responses`: `survey_id`, `user_id`, `cpf`, `user_name`, `answers` (JSON Data).

---

## 📈 3. OPERAÇÕES & GOVERNANÇA

### `financials`
ERP de tesouraria.
- `user_id`: Vinculação de membro.
- `description`, `amount`.
- `type`: `INCOME` (Receita), `EXPENSE` (Despesa).
- `status`: `PAID`, `PENDING`, `OVERDUE`, `CANCELLED`.
- `is_recurring`: Controle de faturamento mensal.

### `documents` & `assemblies`
Arquivo imutável e deliberações.
- `documents`: `title`, `content` (HTML), `type`, `status`.
- `assemblies`: `title`, `description`, `date`, `status`.

### `incidents` (Watchdog)
Ocorrências em tempo real.
- `title`, `location`, `priority` (LOW/CRITICAL), `status` (OPEN/RESOLVED).

---

## 🛡️ 4. INFRAESTRUTURA & IA

### `ai_keys`
Pool de redundância neural.
- `key_value`, `provider`, `tier` (FREE/PAID), `status`.

### `audit_logs`
Trilha de compliance SRE.
- `user_id`, `action`, `table_name`, `record_id`, `details`.

---
**Status do Schema:** 🟢 HOMOLOGADO