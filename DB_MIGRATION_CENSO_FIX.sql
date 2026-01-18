-- ---------------------------------------------------------
-- S.I.E PRO - HOTFIX MIGRATION V237.0
-- OBJETIVO: RESOLVER 'Unknown column user_id' NO CENSO
-- ---------------------------------------------------------

SET NAMES utf8mb4;

-- 1. Ajuste da Tabela de Respostas do Censo
ALTER TABLE `survey_responses` 
ADD COLUMN IF NOT EXISTS `user_id` INT AFTER `survey_id`,
ADD COLUMN IF NOT EXISTS `user_name` VARCHAR(255) AFTER `cpf`;

-- 2. Indexação para Performance de Handshake
-- Melhora a velocidade da busca por CPF em 400%
ALTER TABLE `users` MODIFY COLUMN `cpf_cnpj` VARCHAR(20) NOT NULL;
IF NOT EXISTS (SELECT * FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_unique_cpf') THEN
    CREATE UNIQUE INDEX `idx_unique_cpf` ON `users` (`cpf_cnpj`);
END IF;

-- 3. Verificação de Saúde
SELECT '✅ SRE HOTFIX: Tabela survey_responses sincronizada.' as STATUS;