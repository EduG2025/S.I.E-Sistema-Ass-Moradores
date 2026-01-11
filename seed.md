
-- ---------------------------------------------------------
-- S.I.E PRO - MASTER RECOVERY & HYDRATION SCRIPT V42.1
-- PROTOCOLO SRE: POPULAÇÃO TOTAL DE AMBIENTE CRÍTICO
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- 1. CONFIGURAÇÕES NUCLEARES
DELETE FROM `settings`;
INSERT INTO `settings` (`id`, `name`, `cnpj`, `address`, `email`, `phone`, `primaryColor`, `registrationMode`) 
VALUES (1, 'Associação Residencial S.I.E - Cluster 01', '00.123.456/0001-99', 'Av. das Palmeiras, 1000 - Setor Alfa', 'governanca@sie.pro', '(11) 4002-8922', '#4f46e5', 'APPROVAL');

-- 2. USUÁRIOS, MEMBROS E GEOPROCESSAMENTO
DELETE FROM `users`;
INSERT INTO `users` (`id`, `username`, `password_hash`, `name`, `cpf_cnpj`, `unit`, `role`, `status`, `active`, `email`, `socialData`, `coordinates`) VALUES 
(1, 'admin', '$2b$10$X8XzQ5v8/1Z/4M7m5H.m/O5vFv8/1Z/4M7m5H.m/O5vFv8/1Z/4M', 'ADMINISTRADOR SRE', '000.000.000-00', 'HQ', 'ADMIN', 'ACTIVE', 1, 'admin@sie.pro', '{}', '{"lat":-23.5505,"lng":-46.6333}'),
(2, 'morador1', '$2b$10$X8XzQ5v8/1Z/4M7m5H.m/O5vFv8/1Z/4M7m5H.m/O5vFv8/1Z/4M', 'RICARDO ALMEIDA SANTOS', '111.111.111-11', 'BLOCO A - 101', 'RESIDENT', 'ACTIVE', 1, 'ricardo@email.com', '{"incomeRange":"MID","vulnerabilityScore":10}', '{"lat":-23.5512,"lng":-46.6341}'),
(3, 'morador2', '$2b$10$X8XzQ5v8/1Z/4M7m5H.m/O5vFv8/1Z/4M7m5H.m/O5vFv8/1Z/4M', 'MARIA DAS GRAÇAS SILVA', '222.222.222-22', 'BLOCO B - 205', 'RESIDENT', 'ACTIVE', 1, 'maria@email.com', '{"incomeRange":"LOW","vulnerabilityScore":75,"urgentNeed":"Cesta Básica"}', '{"lat":-23.5498,"lng":-46.6325}'),
(4, 'comerciante1', '$2b$10$X8XzQ5v8/1Z/4M7m5H.m/O5vFv8/1Z/4M7m5H.m/O5vFv8/1Z/4M', 'PADARIA DO SEU JOSÉ', '33.333.333/0001-33', 'BOX 04', 'MERCHANT', 'ACTIVE', 1, 'jose@padaria.com', '{"isMerchant":true}', '{"lat":-23.5520,"lng":-46.6350}');

-- 3. FINANCEIRO (ERP)
DELETE FROM `financials`;
INSERT INTO `financials` (`id`, `user_id`, `description`, `amount`, `type`, `category`, `date`, `status`) VALUES 
(1, 2, 'Cota Condominial Jan/2025', 450.00, 'INCOME', 'CONDOMÍNIO', '2025-01-10', 'PAID'),
(2, 3, 'Cota Condominial Jan/2025', 450.00, 'INCOME', 'CONDOMÍNIO', '2025-01-10', 'PENDING'),
(3, NULL, 'Manutenção de Bombas dÁgua', 1200.00, 'EXPENSE', 'MANUTENÇÃO', '2025-01-15', 'PAID'),
(4, NULL, 'Serviço de Jardinagem Mensal', 800.00, 'EXPENSE', 'MANUTENÇÃO', '2025-01-18', 'PENDING');

-- 4. OCORRÊNCIAS (WATCHDOG)
DELETE FROM `incidents`;
INSERT INTO `incidents` (`id`, `title`, `description`, `location`, `priority`, `status`, `author_id`) VALUES 
(1, 'Lâmpada Queimada no Corredor', 'A lâmpada do terceiro andar do bloco B está piscando.', 'Bloco B - 3º Andar', 'LOW', 'OPEN', 2),
(2, 'Vazamento de Água Grave', 'Cano estourado na área das churrasqueiras.', 'Churrasqueira 02', 'CRITICAL', 'IN_PROGRESS', 3);

-- 5. RESERVAS DE ÁREAS
DELETE FROM `reservations`;
INSERT INTO `reservations` (`id`, `area_name`, `user_id`, `date`, `startTime`, `endTime`, `status`) VALUES 
(1, 'SALÃO DE FESTAS', 2, '2025-02-15', '14:00:00', '22:00:00', 'APPROVED'),
(2, 'CHURRASQUEIRA 01', 3, '2025-02-10', '10:00:00', '18:00:00', 'PENDING');

-- 6. CENSO NEURAL E PESQUISAS
DELETE FROM `surveys`;
INSERT INTO `surveys` (`id`, `title`, `description`, `type`, `status`, `questions`) VALUES 
(1, 'Censo Demográfico Oficial 2025', 'Coleta estratégica para planejamento de recursos da associação.', 'CENSUS', 'ACTIVE', '[{"id":1,"text":"Quantas pessoas residem no imóvel?","type":"number"},{"id":2,"text":"Qual a renda familiar aproximada?","type":"select","options":["Até 1 Salário","1 a 3 Salários","Acima de 3 Salários"]}]');

DELETE FROM `survey_questions`;
INSERT INTO `survey_questions` (`id`, `survey_id`, `text`, `type`, `options`, `mapping_tag`, `required`, `order_priority`) VALUES 
(1, 1, 'Possui portadores de deficiência na unidade?', 'boolean', NULL, 'VULNERABILITY', 1, 1),
(2, 1, 'Faixa de Renda', 'select', '["Baixa","Média","Alta"]', 'INCOME', 1, 2);

DELETE FROM `survey_responses`;
INSERT INTO `survey_responses` (`id`, `survey_id`, `user_cpf`, `answers`) VALUES 
(1, 1, '111.111.111-11', '{"1":"NÃO", "2":"Média"}');

-- 7. DOCUMENTOS E ASSEMBLEIAS
DELETE FROM `documents`;
INSERT INTO `documents` (`id`, `title`, `content`, `type`, `status`) VALUES 
(1, 'Regimento Interno S.I.E V1.0', '# Regimento Interno\n\nArt 1. Fica definido que...', 'OFICIO', 'SIGNED'),
(2, 'Edital de Convocação Assembleia Março', 'Convocamos todos para a assembleia do dia...', 'EDITAL', 'DRAFT');

DELETE FROM `assemblies`;
INSERT INTO `assemblies` (`id`, `title`, `description`, `date`, `status`, `type`, `topics`, `ata_content`) VALUES 
(1, 'Assembleia de Previsão Orçamentária', 'Discussão sobre melhorias 2025.', '2025-03-20 19:00:00', 'SCHEDULED', 'ORDINARY', '[{"id":1, "title": "Aprovação de taxa extra", "voting_type":"YES_NO"}]', NULL);

-- 8. ECONOMIA CIRCULAR (MARKETPLACE)
DELETE FROM `marketplace_items`;
INSERT INTO `marketplace_items` (`id`, `title`, `description`, `category`, `price`, `whatsapp`, `merchant_id`, `status`) VALUES 
(1, 'Pães Artesanais Quentes', 'Pão francês e integral saindo toda manhã.', 'FOOD', 12.50, '(11) 98888-7777', 4, 'ACTIVE'),
(2, 'Serviço de Diarista / Limpeza', 'Profissional com referências no bloco A.', 'SERVICE', 180.00, '(11) 97777-6666', 3, 'ACTIVE');

-- 9. PATRIMÔNIO (ATIVOS)
DELETE FROM `assets`;
INSERT INTO `assets` (`id`, `name`, `category`, `value`, `status`, `date_acquired`, `responsible_id`) VALUES 
(1, 'Roçadeira Husqvarna V5', 'Manutenção', 2400.00, 'PERFEITO', '2024-11-10', 1),
(2, 'Servidor de Câmeras Dell', 'TI', 8500.00, 'BOM', '2023-05-15', 1);

-- 10. IA GATEWAY
DELETE FROM `ai_keys`;
INSERT INTO `ai_keys` (`id`, `label`, `key_value`, `provider`, `tier`, `priority`, `status`) VALUES 
(1, 'Cluster Neural Alfa - Gemini Placeholder', 'AIzaSy_EXEMPLO_PARA_ESTRUTURA', 'GEMINI', 'FREE', 1, 'INVALID');

-- 11. STUDIO E COMUNICAÇÃO
DELETE FROM `templates`;
INSERT INTO `templates` (`id`, `name`, `type`, `width`, `height`, `orientation`, `frontBackground`, `elements`, `is_default`) VALUES 
('tpl_oficial_2025', 'Cartão de Membro S.I.E V5', 'ID_CARD', 320, 200, 'landscape', '#ffffff', '[{"id":"name","type":"text-dynamic","label":"Nome","x":10,"y":10,"layer":"front","style":{"fontSize":"14px"}},{"id":"unit","type":"text-dynamic","label":"Unidade","x":10,"y":30,"layer":"front","style":{"fontSize":"10px"}}]', 1);

DELETE FROM `notices`;
INSERT INTO `notices` (`id`, `title`, `content`, `urgency`, `category`, `date`) VALUES 
(1, 'Manutenção Programada Enel', 'A rede elétrica será desligada dia 22/01 das 08h às 12h.', 'HIGH', 'INFRAESTRUTURA', '2025-01-20'),
(2, 'Campanha de Reciclagem', 'Iniciamos a coleta de óleo usado no container azul.', 'LOW', 'ESG', '2025-01-22');

DELETE FROM `agenda`;
INSERT INTO `agenda` (`id`, `title`, `description`, `date`, `type`, `status`) VALUES 
(1, 'Vistoria Predial Anual', 'Técnicos verificarão as fachadas.', '2025-02-05 09:00:00', 'MAINTENANCE', 'UPCOMING'),
(2, 'Festa Comunitária de Verão', 'Evento para integração dos moradores.', '2025-02-15 18:00:00', 'EVENT', 'UPCOMING');

DELETE FROM `projects`;
INSERT INTO `projects` (`id`, `title`, `description`, `budget`, `spent`, `progress`, `status`, `startDate`, `category`) VALUES 
(1, 'Energia Solar HQ', 'Instalação de 20 painéis fotovoltaicos.', 45000.00, 15000.00, 35, 'IN_PROGRESS', '2024-12-01', 'ENVIRONMENT'),
(2, 'Novo Playground', 'Substituição de brinquedos de madeira por polímero.', 12000.00, 0.00, 0, 'PLANEJAMENTO', '2025-03-01', 'INFRA');

DELETE FROM `suggestions`;
INSERT INTO `suggestions` (`id`, `title`, `content`, `category`, `sentiment`, `upvotes`) VALUES 
(1, 'Mais lixeiras na praça', 'A praça central está ficando suja nos fins de semana.', 'SUGGESTION', 'NEUTRO', 12),
(2, 'Iluminação LED na quadra', 'A quadra está muito escura após as 20h.', 'SUGGESTION', 'POSITIVO', 25);

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
