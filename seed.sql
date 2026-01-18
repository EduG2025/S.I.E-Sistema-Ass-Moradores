-- ---------------------------------------------------------
-- S.I.E PRO - SEED DE HIDRATAÇÃO COMPLETA V225.0
-- PROTOCOLO SRE: POPULAÇÃO DE AMBIENTE DE MISSÃO CRÍTICA
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. LIMPEZA DE SEGURANÇA (OPCIONAL - COMENTE SE NÃO QUISER LIMPAR)
-- TRUNCATE TABLE `settings`;
-- TRUNCATE TABLE `users`;
-- TRUNCATE TABLE `surveys`;

-- 2. CONFIGURAÇÕES NUCLEARES (SINGLETON ID: 1)
INSERT INTO `settings` 
(`id`, `name`, `shortName`, `cnpj`, `address`, `email`, `phone`, `primaryColor`, `registrationMode`, `resident_ui_settings`, `whatsapp_config`) 
VALUES 
(1, 
'Associação Residencial S.I.E PRO', 
'S.I.E PRO', 
'00.123.456/0001-99', 
'Av. das Palmeiras, 1000 - Setor Administrativo Alpha', 
'governanca@siepro.com.br', 
'(11) 4002-8922', 
'#4f46e5', 
'APPROVAL', 
'[{"id":"finance","label":"Financeiro","enabled":true,"icon":"Wallet","detail":"Faturas e pagamentos"},{"id":"reservations","label":"Reservas","enabled":true,"icon":"Calendar","detail":"Áreas comuns"},{"id":"notices","label":"Mural","enabled":true,"icon":"Bell","detail":"Avisos importantes"},{"id":"chat","label":"IA Advisor","enabled":true,"icon":"Brain","detail":"Assistente de governança"},{"id":"access","label":"Portaria","enabled":true,"icon":"Shield","detail":"Acesso e Convites"}]',
'{"api_key": "", "sender": "", "footer": "S.I.E PRO - Governança Digital"}'
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. USUÁRIO ADMINISTRADOR MESTRE
-- Login: admin@siepro.com.br OU 08833340708 | Senha: admin123
INSERT INTO `users` 
(`name`, `username`, `cpf_cnpj`, `email`, `password_hash`, `role`, `status`, `active`, `unit`) 
VALUES 
('SRE ADMIN MASTER', 'admin', '08833340708', 'admin@siepro.com.br', '$2a$10$Y1/Jm7wLAn.yM1Hk8L.oXef6vP4kC1.hM7.m7W7m7W7m7W7m7W7m7', 'ADMIN', 'ACTIVE', 1, 'KERNEL-01')
ON DUPLICATE KEY UPDATE `role` = 'ADMIN';

-- 4. MORADORES DE EXEMPLO (PARA TESTES DE BI)
INSERT INTO `users` 
(`name`, `cpf_cnpj`, `email`, `role`, `status`, `active`, `unit`, `phone`, `socialData`) 
VALUES 
('Carlos Alberto Silva', '11122233344', 'carlos@exemplo.com', 'RESIDENT', 'ACTIVE', 1, 'APTO 101', '11988887777', '{"risk": 15, "tags": ["PAGO_EM_DIA", "CONSELHO"], "income_range": "Acima de 5 SM"}'),
('Maria Eduarda Oliveira', '55566677788', 'maria@exemplo.com', 'RESIDENT', 'ACTIVE', 1, 'CASA 42', '11977776666', '{"risk": 75, "tags": ["PCD", "ALTO_RISCO"], "income_range": "Até 2 SM"}'),
('Sindicato Local', '99988877766', 'sindico@exemplo.com', 'SINDIC', 'ACTIVE', 1, 'ADVOCACIA', '11999990000', '{"risk": 0, "tags": ["GESTAO"]}');

-- 5. COMUNICADOS INICIAIS
INSERT INTO `notices` 
(`title`, `content`, `urgency`, `date`) 
VALUES 
('Bem-vindo ao S.I.E PRO', 'O novo Kernel de Governança Digital foi ativado com sucesso para o nosso cluster.', 'LOW', CURDATE()),
('Manutenção do Gerador', 'Aviso: Manutenção preventiva no gerador central agendada para sábado às 09h.', 'MEDIUM', DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
('URGENTE: Falha na Bomba B', 'Equipe de manutenção já está no local para reparo da bomba de recalque do setor norte.', 'HIGH', CURDATE());

-- 6. CENSO SOCIOECONÔMICO (ESTRUTURA JSON)
INSERT INTO `surveys` 
(`title`, `description`, `type`, `questions`, `status`) 
VALUES 
('Censo Demográfico 2025', 
'Mapeamento obrigatório para atualização dos protocolos sociais e de segurança do condomínio.', 
'CENSUS', 
'[{"id":"q1","text":"Quantas pessoas residem na unidade?","type":"number","required":true,"mapping_tag":"HOUSEHOLD"},{"id":"q2","text":"Existem idosos residindo no local?","type":"boolean","required":true,"mapping_tag":"IDOSO_SOLO"},{"id":"q3","text":"Há portadores de necessidades especiais (PCD)?","type":"boolean","required":true,"mapping_tag":"VULNERABILITY"},{"id":"q4","text":"Renda familiar estimada?","type":"select","options":["Até 2 SM","2 a 5 SM","5 a 10 SM","Acima de 10 SM"],"required":true,"mapping_tag":"INCOME"}]', 
'ACTIVE');

-- 7. LANÇAMENTOS FINANCEIROS (PARA GRÁFICOS)
INSERT INTO `financials` 
(`description`, `amount`, `type`, `category`, `status`, `date`) 
VALUES 
('Arrecadação Mensal - Lote 01-50', 45000.00, 'INCOME', 'CONDOMÍNIO', 'PAID', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
('Serviço de Jardinagem', 2500.00, 'EXPENSE', 'MANUTENÇÃO', 'PAID', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
('Conta de Luz - Áreas Comuns', 3800.50, 'EXPENSE', 'ADMINISTRATIVO', 'PENDING', CURDATE()),
('Doação - Fundo Social Primavera', 1200.00, 'INCOME', 'DOAÇÃO', 'PAID', CURDATE());

-- 8. CRONOGRAMA DE MARCOS (AGENDA)
INSERT INTO `agenda` 
(`title`, `description`, `date`, `type`, `status`) 
VALUES 
('Assembleia de Orçamento', 'Pauta: Reajuste da taxa condominial e plano de obras 2026.', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'MEETING', 'SCHEDULED'),
('Dedetização Áreas Externas', 'Aplicação de inseticida e controle de pragas anual.', DATE_ADD(CURDATE(), INTERVAL(3) DAY), 'MAINTENANCE', 'UPCOMING');

-- 9. OBRAS E PROJETOS
INSERT INTO `projects` 
(`title`, `description`, `budget`, `spent`, `progress`, `startDate`, `status`, `category`) 
VALUES 
('Reforma da Piscina', 'Troca de azulejos e sistema de aquecimento solar.', 85000.00, 42000.00, 50, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'EM_EXECUÇÃO', 'INFRA'),
('Instalação de Câmeras 4K', 'Upgrade dos nós vision para o padrão SRE Vision.', 12000.00, 12000.00, 100, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'CONCLUÍDO', 'SEGURANÇA');

-- 10. PATRIMÔNIO (ASSETS)
INSERT INTO `assets` 
(`name`, `category`, `value`, `status`, `date_acquired`) 
VALUES 
('Trator Roçadeira Husqvarna', 'Equipamento', 15000.00, 'PERFEITO', '2024-01-10'),
('Conjunto de Mesas - Salão de Festas', 'Mobiliário', 8500.00, 'BOM', '2023-05-20'),
('Nobreak Senoidal 3KVA - Server', 'Eletrônico', 4200.00, 'PERFEITO', '2024-11-05');

-- 11. CENTRAL DE MONITORAMENTO (ENDPOINTS EXEMPLO)
INSERT INTO `cameras` 
(`name`, `url`, `location`, `status`) 
VALUES 
('Portão Social', 'https://www.youtube.com/embed/5_XSYlAfJZM', 'Entrada Principal', 'ACTIVE'),
('Praça Central', 'https://www.youtube.com/embed/1-iS7LArMPA', 'Setor Lazer', 'ACTIVE');

-- 12. MARKETPLACE LOCAL
INSERT INTO `marketplace_items` 
(`title`, `description`, `category`, `price`, `whatsapp`, `merchant_id`) 
VALUES 
('Bolos Artesanais da Vovó', 'Bolos caseiros feitos com ingredientes orgânicos. Entrega em todo o cluster.', 'FOOD', 35.00, '11988887777', 2),
('Aulas de Violão e Teclado', 'Aulas particulares para todas as idades. Horários flexíveis.', 'SERVICE', 80.00, '11977776666', 3);

-- 13. OCORRÊNCIAS (WATCHDOG)
INSERT INTO `incidents` 
(`title`, `location`, `priority`, `status`, `description`) 
VALUES 
('Lâmpada Queimada', 'Corredor Bloco B', 'LOW', 'OPEN', 'Morador solicitou troca via terminal.'),
('Vazamento de Água', 'Garagem Subsolo 1', 'HIGH', 'IN_PROGRESS', 'Detectado gotejamento na tubulação mestra.');

SET FOREIGN_KEY_CHECKS = 1;
SELECT '✅ SRE KERNEL HYDRATION COMPLETE | CLUSTER IS NOW OPERATIONAL' as STATUS;
