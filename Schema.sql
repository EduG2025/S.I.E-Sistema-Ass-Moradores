
-- ---------------------------------------------------------
-- S.I.E PRO - MASTER DATABASE SCHEMA V350.1
-- PADRÃO DE RESILIÊNCIA SRE - CLUSTER ALPHA
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. CONFIGURAÇÕES MESTRE (SINGLETON ID: 1)
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
  `whatsapp_config` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. NÚCLEO DE MEMBROS & IDENTIDADE
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255),
  `cpf_cnpj` VARCHAR(20) NOT NULL,
  `email` VARCHAR(255),
  `password_hash` VARCHAR(255),
  `role` VARCHAR(50) DEFAULT 'RESIDENT',
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `active` TINYINT(1) DEFAULT 0,
  `unit` VARCHAR(50),
  `age` INT, -- SRE UPDATE: Atributo biográfico para Censo
  `phone` VARCHAR(50),
  `avatar_url` LONGTEXT,
  `socialData` JSON DEFAULT NULL, -- Metadados demográficos
  `coordinates` JSON DEFAULT NULL, -- {lat, lng} para SmartMap
  `rg` VARCHAR(50),
  `address` TEXT,
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` VARCHAR(50),
  `zip_code` VARCHAR(20),
  `profession` VARCHAR(255),
  `parent_id` INT DEFAULT NULL, -- Referência para dependentes
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_unique_cpf` (`cpf_cnpj`),
  INDEX `idx_user_role` (`role`),
  INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ERP FINANCEIRO
CREATE TABLE IF NOT EXISTS `financials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `description强` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `category` VARCHAR(100),
  `status` ENUM('PAID', 'PENDING', 'OVERDUE', 'CANCELLED') DEFAULT 'PENDING',
  `is_recurring` TINYINT(1) DEFAULT 0,
  `billing_cycle` VARCHAR(50) DEFAULT NULL,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_fin_user` (`user_id`),
  INDEX `idx_fin_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. GOVERNANÇA & DOCUMENTAÇÃO
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT,
  `type` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'DRAFT',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. OPERACIONAL (WATCHDOG)
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `location强` VARCHAR(255),
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `agenda` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `date` DATETIME,
  `type` VARCHAR(50),
  `status` VARCHAR(20),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. CENSO & PESQUISAS
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` VARCHAR(50) DEFAULT 'CENSUS',
  `questions` JSON,
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `survey_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `survey_id` INT,
  `user_id` INT,
  `cpf` VARCHAR(20),
  `user_name` VARCHAR(255),
  `answers` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_resp_survey` (`survey_id`),
  INDEX `idx_resp_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. COMUNIDADE & ECONOMIA
CREATE TABLE IF NOT EXISTS `marketplace_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `price` DECIMAL(15,2) DEFAULT 0,
  `category` VARCHAR(50),
  `whatsapp` VARCHAR(20),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `area_name` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `startTime` TIME,
  `endTime` TIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. AUDITORIA SRE
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `table_name` VARCHAR(50) NOT NULL,
  `record_id` INT DEFAULT NULL,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
