-- ---------------------------------------------------------
-- S.I.E PRO - MASTER DATABASE SCHEMA V242.5 (UPDATED)
-- PADRÃO DE RESILIÊNCIA SRE - CLUSTER MASTER SOBERANO
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. NÚCLEO DE CONFIGURAÇÕES (SINGLETON)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `shortName` VARCHAR(50),
  `cnpj` VARCHAR(50),
  `email` VARCHAR(100),
  `phone` VARCHAR(50),
  `website` VARCHAR(255),
  `primaryColor` VARCHAR(20) DEFAULT '#4f46e5',
  `registrationMode` ENUM('OPEN', 'APPROVAL', 'INVITE_ONLY') DEFAULT 'APPROVAL',
  `logoUrl` LONGTEXT,
  `resident_ui_settings` JSON DEFAULT NULL,
  `whatsapp_config` JSON DEFAULT NULL,
  `module_metadata` JSON DEFAULT NULL,
  `president_name` VARCHAR(255),
  `president_cpf` VARCHAR(20),
  `management_start` DATE,
  `management_end` DATE,
  `president_signature` LONGTEXT,
  `coordinates` JSON DEFAULT NULL,
  `context_rules` LONGTEXT COMMENT 'Base de conhecimento RAG (Regimento/Convenção) para a IA',
  `cep` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(255),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` CHAR(2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. INFRAESTRUTURA IA (POOL NEURAL & PROMPTS)
CREATE TABLE IF NOT EXISTS `ai_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100) DEFAULT NULL,
  `key_value` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(50) DEFAULT 'GOOGLE',
  `model` VARCHAR(100) DEFAULT 'gemini-1.5-flash',
  `tier` VARCHAR(20) DEFAULT 'FREE',
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `priority` INT DEFAULT 1,
  `error_count` INT DEFAULT 0,
  `last_checked` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `prompt_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_prompts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'GERAL',
  `is_favorite` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. IDENTIDADE DIGITAL & SOCIAL (COM OCR E ENDEREÇO)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255),
  `cpf_cnpj` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(255),
  `password_hash` VARCHAR(255),
  `role` VARCHAR(50) DEFAULT 'RESIDENT',
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `active` TINYINT(1) DEFAULT 1,
  `unit` VARCHAR(50),
  `age` INT,
  `birth_date` DATE,
  `rg` VARCHAR(50),
  `issuing_authority` VARCHAR(100),
  `gender` VARCHAR(20),
  `nationality` VARCHAR(50) DEFAULT 'Brasileira',
  `phone` VARCHAR(50),
  `whatsapp` VARCHAR(50),
  `preferred_channel` VARCHAR(20) DEFAULT 'WHATSAPP',
  `avatar_url` LONGTEXT,
  `document_front_url` LONGTEXT,
  `document_back_url` LONGTEXT,
  `ocr_payload` JSON DEFAULT NULL,
  `socialData` JSON DEFAULT NULL,
  `coordinates` JSON DEFAULT NULL,
  `profession` VARCHAR(255),
  `voting_rights` TINYINT(1) DEFAULT 1,
  `resident_type` VARCHAR(50) DEFAULT 'TITULAR',
  `cep` VARCHAR(10),
  `street` VARCHAR(255),
  `number` VARCHAR(20),
  `complement` VARCHAR(255),
  `neighborhood` VARCHAR(100),
  `city` VARCHAR(100),
  `state` CHAR(2),
  `created_by` INT,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_status` (`status`),
  INDEX `idx_user_status_role` (`status`, `role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. GOVERNANÇA & RBAC
CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(50) PRIMARY KEY,
  `label` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role` VARCHAR(50) NOT NULL,
  `permission_id` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`role`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SEGURANÇA, PORTARIA & MONITORAMENTO
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `priority` VARCHAR(100) DEFAULT 'INFORMATIVO (NÍVEL 1)',
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
  `description` TEXT,
  `radius` INT DEFAULT 0,
  `coordinates` JSON,
  `reporter_name` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_incident_status_priority` (`status`, `priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visitors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `document` VARCHAR(50),
  `unit` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'IN_CLUSTER',
  `arrival_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deliveries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `courier` VARCHAR(255),
  `company` VARCHAR(255),
  `unit` VARCHAR(50) NOT NULL,
  `recipient` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `arrival_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cameras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. GESTÃO DOCUMENTAL & ASSEMBLEIAS
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255),
  `content` LONGTEXT,
  `type` VARCHAR(50),
  `status` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assemblies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255),
  `description` TEXT,
  `date` DATETIME,
  `status` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. FINANCEIRO & PATRIMÔNIO
CREATE TABLE IF NOT EXISTS `financials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `category` VARCHAR(100),
  `status` ENUM('PAID', 'PENDING', 'OVERDUE', 'CANCELLED') DEFAULT 'PENDING',
  `recurrence` ENUM('NONE', 'MONTHLY') DEFAULT 'NONE',
  `next_due_date` DATE,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_fin_user` (`user_id`),
  INDEX `idx_fin_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255),
  `category` VARCHAR(100),
  `value` DECIMAL(15,2),
  `status` VARCHAR(50),
  `date_acquired` DATE,
  `responsible_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. COMUNICAÇÃO & ENGAJAMENTO
CREATE TABLE IF NOT EXISTS `notices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `urgency` VARCHAR(20) DEFAULT 'LOW',
  `date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `title` VARCHAR(255),
  `content` TEXT,
  `category` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'OPEN',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agenda` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `date` DATETIME,
  `type` VARCHAR(50),
  `status` VARCHAR(50),
  `location` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. COMÉRCIO & RESERVAS
CREATE TABLE IF NOT EXISTS `marketplace_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `price` DECIMAL(15,2) DEFAULT 0.00,
  `category` VARCHAR(50),
  `whatsapp` VARCHAR(20),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `area_name` VARCHAR(255),
  `date` DATE,
  `startTime` TIME,
  `endTime` TIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. CENSO & RESPOSTAS
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `type` VARCHAR(50) DEFAULT 'CENSUS',
  `questions` JSON,
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `survey_responses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `survey_id` INT NOT NULL,
  `user_id` INT,
  `cpf` VARCHAR(20),
  `user_name` VARCHAR(255),
  `answers` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_resp_survey` (`survey_id`),
  INDEX `idx_resp_cpf` (`cpf`),
  INDEX `idx_survey_user` (`survey_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. MENSAGERIA & TEMPLATES
CREATE TABLE IF NOT EXISTS `message_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_trigger` VARCHAR(50) UNIQUE,
  `name` VARCHAR(100),
  `content` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `variables_available` JSON,
  `attach_logo` TINYINT(1) DEFAULT 0,
  `media_url` TEXT,
  `media_type` VARCHAR(50) DEFAULT 'image',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scheduled_broadcasts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `target_type` VARCHAR(20),
  `target_value` VARCHAR(100),
  `message_body` TEXT,
  `template_id` INT,
  `scheduled_at` DATETIME,
  `status` VARCHAR(20) DEFAULT 'PENDING',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. AUDITORIA & SEGURANÇA SRE
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `action` VARCHAR(50) NOT NULL,
  `table_name` VARCHAR(50) NOT NULL,
  `record_id` INT,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_table` (`table_name`, `record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;