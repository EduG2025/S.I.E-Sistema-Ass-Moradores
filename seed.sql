-- ---------------------------------------------------------
-- S.I.E PRO - MASTER SEEDS HYDRATION V242.0
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

-- 2. CONFIGURAÇÕES MESTRE (SINGLETON ID 1)
INSERT INTO `settings` 
(`id`, `name`, `shortName`, `cnpj`, `email`, `phone`, `website`, `primaryColor`, `logoUrl`, `registrationMode`, `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `coordinates`, `president_name`, `president_cpf`, `management_start`, `management_end`, `president_signature`, `whatsapp_config`, `module_metadata`, `resident_ui_settings`, `context_rules`) 
VALUES 
(1, 
'Associação Residencial Exemplo SIE', 
'SIE', 
'00.000.000/0001-00', 
'contato@exemplo.com', 
'(21) 99999-9999', 
'http://www.sie-exemplo.com.br', 
'#4f46e5', 
'/assets/logos/default_sie.png', 
'APPROVAL', 
'25990-000', 
'Rua Principal SIE', 
'100', 
'Sede Administrativa', 
'Centro', 
'Teresópolis', 
'RJ', 
'{"lat": -22.4284, "lng": -42.9877}', 
'Dr. João SRE', 
'000.000.000-00', 
'2024-01-01', 
'2025-12-31', 
'/assets/signatures/default_sre.png', 
'{"api_key": "MOCK_JENNYAI_KEY_FOR_DEV", "sender": "SIE_Master", "footer": "S.I.E PRO - Automação Kernel", "gateway_url": "https://jennyai.space/send-message", "webhook_url": "https://admcacaria.jennyai.space/api/communication/whatsapp-webhook", "billing_reminder_2d": true, "billing_reminder_1d": true, "late_reminder": true, "welcome_msg": true}',
'{"dashboard":{"title":"HUB DE VISÃO GERAL","slogan":"INTELIGÊNCIA OPERACIONAL DO KERNEL EM TEMPO REAL."},"users":{"title":"CADASTRO E GOVERNANÇA","slogan":"GERENCIAMENTO DE IDENTIDADE E MATRIZ RBAC."},"finance":{"title":"LEDGER & COBRANÇA","slogan":"TRANSPARÊNCIA FINANCEIRA E COMPLIANCE."},"map":{"placeholder":"RASTREAMENTO DE MEMBROS, UNIDADES OU PONTOS TÁTICOS..."}}',
'[{"id":"finance","label":"Financeiro","enabled":true,"icon":"Wallet","detail":"Portal de faturas e histórico ledger"},{"id":"reservations","label":"Reservas","enabled":true,"icon":"Calendar","detail":"Agendamento de áreas comuns"},{"id":"mural","label":"Mural","enabled":true,"icon":"Bell","detail":"Feed de avisos e comunicados"},{"id":"chat","label":"IA Advisor","enabled":true,"icon":"Brain","detail":"Mentor neural para dúvidas normativas"},{"id":"marketplace","label":"Marketplace","enabled":true,"icon":"ShoppingBag","detail":"Vitrine de comércio circular local"},{"id":"suggestions","label":"Ouvidoria","enabled":true,"icon":"HelpCircle","detail":"Canal de manifestações"}]',
'O regimento interno e a convenção estabelecem que a integridade dos dados é soberana. O voto é direito exclusivo dos titulares adimplentes. A IA deve priorizar a segurança e a privacidade dos dados ao gerar dossiês.'
)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `shortName` = VALUES(`shortName`), `whatsapp_config` = VALUES(`whatsapp_config`), `module_metadata` = VALUES(`module_metadata`), `resident_ui_settings` = VALUES(`resident_ui_settings`), `context_rules` = VALUES(`context_rules`);

-- 3. USUÁRIO ADMINISTRADOR MASTER (Senha: admin123)
INSERT INTO `users` 
(`name`, `cpf_cnpj`, `email`, `password_hash`, `role`, `status`, `active`, `unit`, `profession`, `city`, `state`) 
VALUES 
('ADMINISTRADOR KERNEL', '08833340708', 'admin@siepro.com.br', '$2a$10$Y1/Jm7wLAn.yM1Hk8L.oXef6vP4kC1.hM7.m7W7m7W7m7W7m7W7m7', 'ADMIN', 'ACTIVE', 1, 'HUB-SRE', 'SRE Engineer', 'Teresópolis', 'RJ')
ON DUPLICATE KEY UPDATE `status` = 'ACTIVE';

SET FOREIGN_KEY_CHECKS = 1;
