# 🏛️ DICIONÁRIO DE DADOS MESTRE S.I.E PRO (V240.2 - AUDITED)

Este documento representa o **Contrato de Persistência Soberana** do cluster S.I.E. Todas as colunas listadas abaixo foram auditadas e estão sincronizadas entre o Frontend (Registro Público/Admin) e o Banco de Dados MySQL.

---

## 👤 1. IDENTIDADE DIGITAL & SOCIAL (Dossiê Master)

### Tabela: `users`
Armazena o dossiê biométrico e civil de todos os membros do cluster.

| Coluna | Tipo | Origem UI | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | INT (AI) | Sistema | Identificador único. |
| `name` | VARCHAR(255) | **Nome Completo** | Nome civil em caixa alta. |
| `cpf_cnpj` | VARCHAR(20) (U)| **CPF (Único)** | Chave única de identificação (apenas números). |
| `birth_date` | DATE | **Data Nascimento** | Data original para cálculo de BI. |
| `rg` | VARCHAR(50) | **RG** | Registro Geral Civil. |
| `issuing_authority` | VARCHAR(100) | **Emissor** | Órgão emissor do documento (SSP/UF). |
| `gender` | VARCHAR(20) | **Gênero** | Identidade de gênero. |
| `unit` | VARCHAR(50) | **Unidade / Cluster** | Localização habitacional do membro. |
| `resident_type` | VARCHAR(50) | **Tipo Residente** | TITULAR, DEPENDENTE, INQUILINO, etc. |
| `voting_rights` | TINYINT(1) | **Direito a Voto** | Elegibilidade em assembleias (1=Sim, 0=Não). |
| `role` | VARCHAR(50) | **Cargo / Papel** | Nível de acesso RBAC. |
| `status` | VARCHAR(20) | **Estado de Conta** | ACTIVE, PENDING, SUSPENDED, BLOCKED. |
| `password_hash` | VARCHAR(255) | **Nova Chave** | Hash Bcrypt da senha de acesso. |
| `email` | VARCHAR(255) | **E-mail** | Endereço eletrônico principal. |
| `phone` | VARCHAR(50) | **Telefone / Fixo** | Contato telefônico voz. |
| `whatsapp` | VARCHAR(50) | **WhatsApp Bridge**| Número para mensageria ativa JennyAI. |
| `preferred_channel` | VARCHAR(20) | **Canal Preferido**| WHATSAPP, EMAIL ou APP. |
| `avatar_url` | LONGTEXT | **Foto ID** | Biometria facial em Base64/URI. |
| `active` | TINYINT(1) | Sistema | Exclusão lógica (1=Ativo). |
| `created_at` | TIMESTAMP | Sistema | Timestamp de entrada no cluster. |
| `updated_at` | TIMESTAMP | Sistema | Última mutação de registro. |

---

## 🏗️ 2. CORE & CONFIGURAÇÕES

### Tabela: `settings`
Governa a marca e o comportamento global.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT (PK) | Singleton ID 1. |
| `whatsapp_config` | JSON | Credenciais do Bridge JennyAI (api_key, sender). |
| `module_metadata`| JSON | Títulos e slogans dinâmicos dos Headers. |
| `primaryColor` | VARCHAR(20) | Hexadecimal da identidade visual. |

---

## 📊 3. CENSO & RESPOSTAS

### Tabela: `survey_responses`
Log histórico de participações socioeconômicas.

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | INT (AI) | Protocolo de resposta. |
| `survey_id` | INT | Vínculo com o formulário. |
| `user_id` | INT | Vínculo com a tabela `users`. |
| `cpf` | VARCHAR(20) | CPF do respondente para vinculação rápida. |
| `answers` | JSON | Payload das perguntas do censo. |

---
**Status da Auditoria:** 🟢 APROVADO PARA PRODUÇÃO (V240.2)