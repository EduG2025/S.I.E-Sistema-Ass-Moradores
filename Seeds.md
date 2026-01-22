# 🧪 SCRIPT DE HIDRATAÇÃO S.I.E PRO (V240.1)

Execute este script no terminal MySQL para ativar o Kernel Alpha.

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CONFIGURAÇÕES MASTER (SINGLETON ID: 1)
INSERT INTO `settings` 
(`id`, `name`, `shortName`, `primaryColor`, `registrationMode`, `resident_ui_settings`, `module_metadata`) 
VALUES 
(1, 
'S.I.E PRO - SISTEMA INTELIGENTE ATIVO', 
'S.I.E PRO', 
'#4f46e5', 
'APPROVAL', 
'[{"id":"finance","label":"Financeiro","enabled":true,"icon":"Wallet","detail":"Faturas"},{"id":"reservations","label":"Reservas","enabled":true,"icon":"Calendar","detail":"Áreas comuns"},{"id":"chat","label":"IA Advisor","enabled":true,"icon":"Brain","detail":"Mentor neural"}]',
'{"dashboard":{"title":"Comando Central","slogan":"Visão Estratégica do Cluster"},"users":{"title":"Membros & Identidades","slogan":"Gestão de Identidade Soberana"},"finance":{"title":"Tesouraria Sincronizada","slogan":"Controle de Fluxo de Caixa Ledger"}}'
);

-- 2. CARGOS HIERÁRQUICOS (RBAC)
INSERT IGNORE INTO `roles` (`id`, `label`) VALUES 
('ADMIN', 'Administrador Master'),
('PRESIDENT', 'Presidente / Síndico'),
('COUNCIL', 'Conselho Consultivo'),
('RESIDENT', 'Morador Ativo'),
('SERVICE', 'Prestador de Serviço');

-- 3. MATRIZ DE PERMISSÕES SRE
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES 
('ADMIN', '*'),
('RESIDENT', 'view_dashboard'),
('RESIDENT', 'use_marketplace'),
('RESIDENT', 'use_reservations'),
('RESIDENT', 'view_timeline');

-- 4. USUÁRIO ADMINISTRADOR MASTER
-- Chave de Acesso Padrão: Gegerminal180
INSERT INTO `users` 
(`name`, `cpf_cnpj`, `email`, `password_hash`, `role`, `status`, `active`, `unit`) 
VALUES 
('ADMINISTRADOR KERNEL', '08833340708', 'admin@siepro.com.br', '$2a$10$7Z8l8Y2u3uO7pW4K5v6v6.W9O1JjE5P6U8Y5u3uO7pW4K5v6v6', 'ADMIN', 'ACTIVE', 1, 'HUB-SRE');

-- 5. CENSO DEMOGRÁFICO DE AMOSTRA
INSERT INTO `surveys` 
(`title`, `description`, `type`, `questions`, `status`) 
VALUES 
('Censo de Identidade 2025', 
'Mapeamento demográfico oficial para fins de segurança e BI social.', 
'CENSUS', 
'[{"id":"q1","text":"Possui membros PCD na residência?","type":"boolean","required":true,"mapping_tag":"HEALTH"},{"id":"q2","text":"Quantos veículos acessam a unidade?","type":"number","required":true,"mapping_tag":"IDENTITY"}]', 
'ACTIVE'
);

-- 6. POOL NEURAL INICIAL (FAILOVER)
-- Chave do Ambiente injetada como prioridade 1
INSERT INTO `ai_keys` (`label`, `key_value`, `provider`, `model`, `tier`, `priority`, `status`) 
VALUES ('Gemini Environment Primary', 'YOUR_API_KEY_HERE', 'GOOGLE', 'gemini-3-flash-preview', 'FREE', 1, 'ACTIVE');

SET FOREIGN_KEY_CHECKS = 1;
```

---
**Protocolo:** SRE-SEED-HYDRATION-OK