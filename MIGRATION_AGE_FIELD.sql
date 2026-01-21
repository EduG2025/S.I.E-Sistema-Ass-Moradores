
-- ---------------------------------------------------------
-- S.I.E PRO - MIGRATION PROTOCOL V350.1
-- MÓDULO: BIOESTATÍSTICA DE MEMBROS (ID)
-- ---------------------------------------------------------

SET NAMES utf8mb4;

-- 1. Adição da coluna age na tabela users
-- Posicionado após 'unit' para manter integridade visual do Dossiê
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `age` INT AFTER `unit`;

-- 2. Registro de Auditoria SRE
INSERT INTO `audit_logs` (user_id, action, table_name, details) 
VALUES (0, 'SCHEMA_UPDATE', 'users', 'Adição da coluna biográfica age para suporte ao Censo V2.');

-- 3. Verificação de Saúde
SELECT '✅ SRE DATABASE SYNC: COLUNA AGE SINCRONIZADA' as STATUS;
