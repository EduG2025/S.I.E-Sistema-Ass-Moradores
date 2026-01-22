# 🏛️ ESQUEMA DE DADOS S.I.E PRO (V240.0)

Documentação oficial da arquitetura de persistência do Kernel S.I.E PRO, otimizada para MySQL 8.0+.

## 🏗️ 1. CONFIGURAÇÕES & CORE (Singleton & RBAC)

### `settings`
Registro único (ID: 1) que governa a identidade e o comportamento global do cluster.
- `id`: INT (PK)
- `name`: VARCHAR(255) - Razão Social da Entidade.
- `shortName`: VARCHAR(50) - Nome fantasia/Sigla.
- `cnpj`: VARCHAR(50) - Documento fiscal.
- `address`, `email`, `phone`, `website`: Dados de contato.
- `primaryColor`: VARCHAR(20) - Hexadecimal da identidade visual (ex: #4f46e5).
- `registrationMode`: ENUM('OPEN', 'APPROVAL', 'INVITE_ONLY') - Política de novos membros.
- `logoUrl`: LONGTEXT - Armazenamento soberano de imagem em Base64.
- `resident_ui_settings`: JSON - Toggles de módulos para a visão do morador (On/Off).
- `whatsapp_config`: JSON - Credenciais do Messenger Gateway (api_key, sender, footer).
- `module_metadata`: JSON - Títulos e slogans dinâmicos para os Headers do sistema.
- `coordinates`: JSON - {lat, lng} do epicentro tático da sede.

### `roles` & `role_permissions`
- `roles`: `id` (VARCHAR), `label` (VARCHAR).
- `role_permissions`: `role` (FK), `permission_id` (VARCHAR).

---

## 👤 2. IDENTIDADE & BI (Dossiê de Membros)

### `users`
- `id`: INT (PK AUTO_INCREMENT)
- `name`: VARCHAR(255) - Nome completo.
- `cpf_cnpj`: VARCHAR(20) (UNIQUE) - Identificador soberano normalizado.
- `email`: VARCHAR(255) (UNIQUE).
- `password_hash`: VARCHAR(255).
- `role`: VARCHAR(50) (FK -> roles).
- `status`: VARCHAR(20) - ACTIVE, PENDING, BANNED.
- `unit`: VARCHAR(50) - Identificação da unidade/cluster.
- `age`: INT - Idade biográfica calculada.
- `birthDate`: DATE - Data de nascimento original.
- `rg`, `issuing_authority`: Documentação complementar.
- `socialData`: JSON - Metadados demográficos (risco, tags, vulnerabilidades).
- `coordinates`: JSON - Localização {lat, lng} para plotagem no SmartMap.
- `address`, `number`, `neighborhood`, `city`, `state`, `zip_code`: Endereço estruturado.

---

## 💳 3. OPERAÇÕES & GOVERNANÇA

### `financials` (ERP de Tesouraria)
- `user_id`: INT (FK -> users).
- `description`: VARCHAR(255).
- `amount`: DECIMAL(15,2).
- `type`: ENUM('INCOME', 'EXPENSE').
- `status`: ENUM('PAID', 'PENDING', 'OVERDUE', 'CANCELLED').
- `is_recurring`: TINYINT(1) - Controle de recorrência mensal.
- `next_due_date`: DATE.
- `date`: DATE - Data de emissão.

### `surveys` & `survey_responses` (Censo Neural)
- `surveys`: `title`, `description`, `questions` (JSON Schema), `status`.
- `survey_responses`: `survey_id`, `user_id`, `cpf`, `answers` (JSON Data).

### `incidents` (Watchdog)
- `title`, `location`, `priority` (LEVEL 1-4), `status`.
- `coordinates`: JSON - Ponto tático no mapa.
- `radius`: INT - Raio de notificação em KM.

---

## 🤖 4. INFRAESTRUTURA & IA

### `ai_keys` (Pool Neural)
- `key_value`: VARCHAR(255) - Chave de API secreta.
- `provider`: VARCHAR(50) - GOOGLE, OPENAI, etc.
- `model`: VARCHAR(100) - Modelo preferencial (ex: gemini-3-flash).
- `tier`: VARCHAR(20) - FREE, PAID.
- `priority`: INT - Ordem de uso no failover.
- `error_count`: INT - Monitor de saúde do token.

### `audit_logs` (Compliance)
- `user_id`: INT (FK).
- `action`: CREATE, UPDATE, DELETE, SECURITY_BREACH.
- `table_name`: Alvo da ação.
- `record_id`: ID do registro afetado.
- `details`: TEXT - Payload JSON do estado anterior/atual.

---
**Status:** 🟢 SCHEMA HOMOLOGADO V24.0