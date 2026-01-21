
-- ---------------------------------------------------------
-- S.I.E PRO - MASTER DATABASE SCHEMA V180.1
-- PADRÃO DE RESILIÊNCIA SRE - CLUSTER MASTER
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. ESTRUTURA DE GOVERNANÇA & RBAC
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role` VARCHAR(50) NOT NULL,
  `permission_id` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`role`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CONFIGURAÇÕES MESTRE (SINGLETON ID: 1)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255),
  `shortName` VARCHAR(50),
  `cnpj` VARCHAR(50),
  `address` TEXT,
  `email` VARCHAR(100),
  `phone` VARCHAR(50),
  `website` VARCHAR(255),
  `primaryColor` VARCHAR(20) DEFAULT '#4f46e5',
  `registrationMode` ENUM('OPEN', 'APPROVAL', 'INVITE_ONLY') DEFAULT 'APPROVAL',
  `logoUrl` LONGTEXT,
  `resident_ui_settings` JSON DEFAULT NULL,
  `whatsapp_config` JSON DEFAULT NULL, -- Armazena {api_key, sender, footer}
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Garante existência do registro único de configuração
INSERT IGNORE INTO `settings` (`id`, `name`, `shortName`, `whatsapp_config`) 
VALUES (1, 'Associação Residencial S.I.E', 'S.I.E PRO', '{"api_key": "", "sender": "", "footer": "S.I.E PRO"}');

-- 3. NÚCLEO DE MEMBROS & IDENTIDADE
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255),
  `cpf_cnpj` VARCHAR(20) NOT NULL,
  `email` VARCHAR(255),
  `password_hash` VARCHAR(255),
  `role强` VARCHAR(50) DEFAULT 'RESIDENT',
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `active` TINYINT(1) DEFAULT 0,
  `unit` VARCHAR(50),
  `age` INT, -- SRE UPDATE: Atributo biográfico
  `phone` VARCHAR(50),
  `avatar_url` LONGTEXT,
  `socialData` JSON DEFAULT NULL, -- Score de risco, vulnerabilidades, etc.
  `coordinates` JSON DEFAULT NULL, -- {lat, lng} para SmartMap
  `rg` VARCHAR(50),
  `address` TEXT,
  `profession` VARCHAR(255),
  `parent_id` INT DEFAULT NULL,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_unique_cpf` (`cpf_cnpj`),
  INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ERP FINANCEIRO & AUDITORIA
CREATE TABLE IF NOT EXISTS `financials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `category` VARCHAR(100),
  `status` ENUM('PAID', 'PENDING', 'OVERDUE', 'CANCELLED') DEFAULT 'PENDING',
  `is_recurring` TINYINT(1) DEFAULT 0,
  `billing_cycle` VARCHAR(50) DEFAULT NULL,
  `next_due_date` DATE DEFAULT NULL,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_fin_user` (`user_id`),
  INDEX `idx_fin_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `table_name` VARCHAR(50) NOT NULL,
  `record_id` INT DEFAULT NULL,
  `details` TEXT, -- Armazena JSON do payload original ou diff
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_table` (`table_name`, `record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SEGURANÇA & MONITORAMENTO (VISION)
CREATE TABLE IF NOT EXISTS `cameras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. INTELIGÊNCIA ARTIFICIAL & MENSAGERIA
CREATE TABLE IF NOT EXISTS `ai_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100),
  `key_value` VARCHAR(255) NOT NULL,
  `provider` ENUM('GOOGLE', 'OPENAI') DEFAULT 'GOOGLE',
  `tier` ENUM('FREE', 'PAID') DEFAULT 'FREE',
  `priority` INT DEFAULT 1,
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `error_count` INT DEFAULT 0,
  `last_checked` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `whatsapp_broadcast_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `target_role` VARCHAR(50) DEFAULT 'ALL',
  `message_body` TEXT NOT NULL,
  `recipient_count` INT DEFAULT 0,
  `status` ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'QUEUED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. INFRAESTRUTURA COMUNITÁRIA
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT,
  `type` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'DRAFT',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `budget` DECIMAL(15,2) DEFAULT 0,
  `spent` DECIMAL(15,2) DEFAULT 0,
  `progress` INT DEFAULT 0,
  `startDate` DATE,
  `category` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'PLANNING'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `surveys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` VARCHAR(50),
  `questions` JSON,
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
