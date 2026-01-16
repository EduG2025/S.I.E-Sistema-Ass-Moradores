
-- ---------------------------------------------------------
-- S.I.E PRO - MIGRATION PROTOCOL V180.0
-- MÓDULO: GATEWAY DE WHATSAPP (JENNYAI BRIDGE)
-- ---------------------------------------------------------

SET NAMES utf8mb4;

-- 1. Garante que a tabela settings possui a coluna whatsapp_config
-- Esta coluna armazena o JSON de integração (api_key, sender, footer)
ALTER TABLE `settings` 
ADD COLUMN IF NOT EXISTS `whatsapp_config` JSON DEFAULT NULL AFTER `resident_ui_settings`;

-- 2. Inicialização do Singleton de Configuração (ID 1)
-- Se não existir o registro mestre, cria com valores em branco
INSERT INTO `settings` (`id`, `name`, `shortName`, `whatsapp_config`) 
VALUES (1, 'Associação Residencial S.I.E', 'S.I.E PRO', '{"api_key": "", "sender": "", "footer": "S.I.E PRO"}')
ON DUPLICATE KEY UPDATE `shortName` = `shortName`;

-- 3. Criação de Tabela de Logs de Broadcast (Opcional para Auditoria SRE)
CREATE TABLE IF NOT EXISTS `whatsapp_broadcast_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL, -- ID do Admin que realizou o disparo
  `target_role` VARCHAR(50) DEFAULT 'ALL',
  `message_body` TEXT NOT NULL,
  `recipient_count` INT DEFAULT 0,
  `status` ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'QUEUED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Verificação de Saúde
SELECT '✅ SRE DATABASE SYNC: WHATSAPP GATEWAY READY' as STATUS;
