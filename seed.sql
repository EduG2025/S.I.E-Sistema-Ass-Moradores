
-- ---------------------------------------------------------
-- S.I.E PRO - SEED DE HIDRATAÇÃO INICIAL V350.1
-- ---------------------------------------------------------

SET NAMES utf8mb4;

-- 1. CONFIGURAÇÕES GERAIS (Singleton)
INSERT INTO `settings` 
(`id`, `name`, `shortName`, `cnpj`, `address`, `primaryColor`, `registrationMode`, `resident_ui_settings`, `whatsapp_config`) 
VALUES 
(1, 
'Associação Residencial S.I.E PRO', 
'S.I.E PRO', 
'00.000.000/0001-00', 
'Sede Administrativa Central - Cluster 01', 
'#4f46e5', 
'APPROVAL', 
'[{"id":"finance","label":"Financeiro","enabled":true,"icon":"Wallet","detail":"Faturas e pagamentos"},{"id":"reservations","label":"Reservas","enabled":true,"icon":"Calendar","detail":"Áreas comuns"},{"id":"notices","label":"Mural","enabled":true,"icon":"Bell","detail":"Avisos importantes"},{"id":"chat","label":"IA Advisor","enabled":true,"icon":"Brain","detail":"Assistente de governança"}]',
'{"api_key": "", "sender": "", "footer": "S.I.E PRO"}')
ON DUPLICATE KEY UPDATE `name` = `name`;

-- 2. USUÁRIO ADMINISTRADOR MASTER
INSERT INTO `users` 
(`name`, `cpf_cnpj`, `email`, `password_hash`, `role`, `status`, `active`, `unit`, `coordinates`) 
VALUES 
('ADMINISTRADOR KERNEL', '08833340708', 'admin@siepro.com.br', '$2a$10$Y1/Jm7wLAn.yM1Hk8L.oXef6vP4kC1.hM7.m7W7m7W7m7W7m7W7m7', 'ADMIN', 'ACTIVE', 1, 'HUB-SRE', '{"lat": -23.5505, "lng": -46.6333}')
ON DUPLICATE KEY UPDATE `role` = 'ADMIN';

-- 3. MORADORES DE EXEMPLO (SRE UPDATE: Inclusão de idades para BI)
INSERT INTO `users` 
(`name`, `cpf_cnpj`, `email`, `role`, `status`, `active`, `unit`, `age`, `phone`, `socialData`, `coordinates`) 
VALUES 
('Carlos Silva', '11122233344', 'carlos@exemplo.com', 'RESIDENT', 'ACTIVE', 1, 'APTO 101', 34, '11988887777', '{"risk": 15, "tags": ["PAGO_EM_DIA"]}', '{"lat": -23.5510, "lng": -46.6340}'),
('Maria Oliveira', '55566677788', 'maria@exemplo.com', 'RESIDENT', 'ACTIVE', 1, 'CASA 42', 68, '11977776666', '{"risk": 75, "tags": ["ALTO_RISCO"]}', '{"lat": -23.5500, "lng": -46.6320}');

-- 4. CENSO DEMOGRÁFICO INICIAL
INSERT INTO `surveys` 
(`title`, `description`, `type`, `questions`, `status`) 
VALUES 
('Censo Demográfico 2025', 
'Mapeamento demográfico oficial do cluster para fins de governança social.', 
'CENSUS', 
'[{"id":"q1","text":"Quantas pessoas residem na unidade?","type":"number","required":true,"mapping_tag":"HOUSEHOLD"},{"id":"q2","text":"Possui algum membro com deficiência (PCD)?","type":"boolean","required":true,"mapping_tag":"VULNERABILITY"},{"id":"q3","text":"Renda familiar mensal aproximada?","type":"select","options":["ATÉ 2 SM","2 A 5 SM","ACIMA DE 5 SM"],"required":true,"mapping_tag":"INCOME"}]', 
'ACTIVE');

-- [RESTANTE DO SEED MANTIDO]
SELECT '✅ HIDRATAÇÃO KERNEL S.I.E CONCLUÍDA COM DADOS BIOMÉTRICOS' as STATUS;
