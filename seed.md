
-- ---------------------------------------------------------
-- S.I.E PRO - SEED DE HIDRATAÇÃO V22.0
-- ---------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

-- Configurações Master
INSERT INTO `settings` (`id`, `name`, `cnpj`, `address`, `email`, `phone`, `logoUrl`)
VALUES (1, 'S.I.E PRO - Gestão Ativa', '00.000.000/0001-99', 'Cluster Administrativo S.I.E - SP', 'governanca@sie.pro', '(11) 98888-7777', NULL)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Administrador Master (Senha: admin123)
INSERT INTO `users` (`username`, `password_hash`, `name`, `email`, `cpf_cnpj`, `role`, `status`)
VALUES ('admin', '$2a$10$VvQ6.N.XWzD7I5S/U.r3OuN.XWzD7I5S/U.r3OuN.XWzD7I5S/U.r3', 'Admin Master SRE', 'admin@sie.pro', '00000000000', 'ADMIN', 'ACTIVE')
ON DUPLICATE KEY UPDATE username=VALUES(username);

-- Moradores de Teste para BI Demográfico
INSERT INTO `users` (`username`, `name`, `email`, `cpf_cnpj`, `unit`, `role`, `status`, `socialData`, `password_hash`)
VALUES 
('11111111111', 'João da Silva', 'joao@email.com', '111.111.111-11', 'A-101', 'RESIDENT', 'ACTIVE', '{"incomeRange": "MID", "residentsCount": 4, "childrenCount": 2, "age": 35}', '$2a$10$VvQ6.N.XWzD7I5S/U.r3OuN.XWzD7I5S/U.r3OuN.XWzD7I5S/U.r3'),
('22222222222', 'Maria Oliveira', 'maria@email.com', '222.222.222-22', 'B-204', 'RESIDENT', 'ACTIVE', '{"incomeRange": "LOW", "residentsCount": 1, "childrenCount": 0, "age": 68}', '$2a$10$VvQ6.N.XWzD7I5S/U.r3OuN.XWzD7I5S/U.r3OuN.XWzD7I5S/U.r3');

-- Financeiro Real
INSERT INTO `financials` (`description`, `amount`, `type`, `status`, `category`, `date`, `user_id`)
VALUES 
('Cota Condominial - A-101', 450.00, 'INCOME', 'PAID', 'CONDOMÍNIO', NOW(), 2),
('Manutenção Elevadores', 1200.00, 'EXPENSE', 'PAID', 'MANUTENÇÃO', NOW(), NULL),
('Reserva Salão de Festas', 150.00, 'INCOME', 'PENDING', 'EVENTOS', NOW(), 3);

-- Ocorrências
INSERT INTO `incidents` (`title`, `location`, `priority`, `status`, `created_at`)
VALUES 
('Lâmpada Queimada', 'Corredor Bloco A', 'LOW', 'RESOLVED', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('Vazamento Garagem', 'Subsolo 1', 'HIGH', 'IN_PROGRESS', NOW());

SET FOREIGN_KEY_CHECKS = 1;
