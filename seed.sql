-- ---------------------------------------------------------
-- S.I.E PRO - MASTER SEEDS HYDRATION V240.5
-- PROTOCOLO SRE: POPULAÇÃO DE AMBIENTE OPERACIONAL
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CARGOS NUCLEARES
INSERT IGNORE INTO `roles` (`id`, `label`) VALUES 
('ADMIN', 'Administrador de Cluster (Master)'),
('PRESIDENT', 'Presidente / Síndico Executivo'),
('COUNCIL', 'Conselho de Governança'),
('RESIDENT', 'Membro Associado Ativo');

-- 2. CONFIGURAÇÕES MESTRE
INSERT INTO `settings` 
(`id`, `name`, `shortName`, `primaryColor`, `registrationMode`, `resident_ui_settings`, `whatsapp_config`, `module_metadata`) 
VALUES 
(1, 
'S.I.E PRO - SISTEMA INTELIGENTE ATIVO', 
'S.I.E PRO', 
'#4f46e5', 
'APPROVAL', 
'[{"id":"finance","label":"Financeiro","enabled":true,"icon":"Wallet","detail":"Faturas"},{"id":"reservations","label":"Reservas","enabled":true,"icon":"Calendar","detail":"Áreas comuns"},{"id":"chat","label":"IA Advisor","enabled":true,"icon":"Brain","detail":"Mentor neural"}]',
'{"api_key": "", "sender": "", "footer": "S.I.E PRO", "gateway_url": "https://jennyai.space/send-message"}',
'{"dashboard":{"title":"Painel de Comando","slogan":"Visão Estratégica do Cluster"},"users":{"title":"Gestão de Membros","slogan":"Identidade Digital Soberana"},"finance":{"title":"Fluxo Ledger","slogan":"Controle Financeiro Transparente"},"settings":{"title":"Console Master","slogan":"Protocolo de Resiliência SRE V8.0"}}'
)
ON DUPLICATE KEY UPDATE `shortName` = `shortName`;

-- 3. USUÁRIO ADMINISTRADOR MASTER (Senha: admin123)
INSERT INTO `users` 
(`name`, `cpf_cnpj`, `email`, `password_hash`, `role`, `status`, `active`, `unit`) 
VALUES 
('ADMINISTRADOR KERNEL', '08833340708', 'admin@siepro.com.br', '$2a$10$Y1/Jm7wLAn.yM1Hk8L.oXef6vP4kC1.hM7.m7W7m7W7m7W7m7W7m7', 'ADMIN', 'ACTIVE', 1, 'HUB-SRE')
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE';

-- 4. POOL NEURAL DE SEGURANÇA
INSERT IGNORE INTO `ai_keys` (`label`, `key_value`, `provider`, `model`, `tier`, `status`, `priority`) VALUES 
('Gemini Primary Flash', '', 'GOOGLE', 'gemini-3-flash-preview', 'FREE', 'ACTIVE', 10),
('Gemini Backup Pro', '', 'GOOGLE', 'gemini-3-pro-preview', 'PRO', 'ACTIVE', 1);

SET FOREIGN_KEY_CHECKS = 1;