-- ---------------------------------------------------------
-- S.I.E PRO - MASTER DATABASE SCHEMA V240.8 (AUDITED)
-- PADRÃO DE RESILIÊNCIA SRE - CLUSTER MASTER SOBERANO
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. NÚCLEO DE CONFIGURAÇÕES (SINGLETON ID 1)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
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
  `module_metadata` JSON DEFAULT NULL,
  `president_name` VARCHAR(255),
  `president_cpf` VARCHAR(20),
  `management_start` DATE,
  `management_end` DATE,
  `president_signature` LONGTEXT,
  `coordinates` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. INFRAESTRUTURA IA (POOL NEURAL)
CREATE TABLE IF NOT EXISTS `ai_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100) DEFAULT NULL,
  `key_value` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(50) DEFAULT 'GOOGLE',
  `model` VARCHAR(100) DEFAULT 'gemini-3-flash-preview',
  `tier` VARCHAR(20) DEFAULT 'FREE',
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `priority` INT DEFAULT 1,
  `error_count` INT DEFAULT 0,
  `last_checked` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. IDENTIDADE DIGITAL & SOCIAL
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255),
  `cpf_cnpj` VARCHAR(20) NOT NULL UNIQUE,
  `email?` VARCHAR(255),
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
  `socialData` JSON DEFAULT NULL,
  `coordinates` JSON DEFAULT NULL,
  `address` TEXT,
  `profession` VARCHAR(255),
  `voting_rights` TINYINT(1) DEFAULT 1,
  `resident_type` VARCHAR(50) DEFAULT 'TITULAR',
  `created_by` INT,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_status` (`status`)
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

-- 5. SEGURANÇA & PORTARIA (CONCIERGE / WATCHDOG)
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `priority` VARCHAR(100) DEFAULT 'LOW',
  `status` VARCHAR(20) DEFAULT 'OPEN',
  `description` TEXT,
  `radius` INT DEFAULT 0,
  `coordinates` JSON,
  `reporter_name` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `visitors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `document` VARCHAR(50),
  `unit` VARCHAR(50) NOT NULL,
  `phone?` VARCHAR(50),
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

-- 6. COMUNICAÇÃO & ENGAJAMENTO
CREATE TABLE IF NOT EXISTS `notices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `urgency` VARCHAR(20) DEFAULT 'LOW',
  `date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `title?` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `category` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'OPEN',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AGENDA & MARCOS
CREATE TABLE IF NOT EXISTS `agenda` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `date` DATETIME NOT NULL,
  `type` VARCHAR(50),
  `status` VARCHAR(50),
  `location` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. COMÉRCIO & RECURSOS
CREATE TABLE IF NOT EXISTS `marketplace_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(50),
  `price` DECIMAL(15,2) DEFAULT 0,
  `whatsapp` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `area_name` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `startTime` TIME,
  `endTime` TIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CENSO & RESPOSTAS
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
  `survey_id` INT,
  `user_id` INT,
  `cpf` VARCHAR(20),
  `user_name` VARCHAR(255),
  `answers` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. MENSAGERIA & TEMPLATES
CREATE TABLE IF NOT EXISTS `message_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_trigger` VARCHAR(50) UNIQUE,
  `name` VARCHAR(100),
  `content` TEXT,
  `is_active` TINYINT(1) DEFAULT 1,
  `variables_available` JSON,
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

SET FOREIGN_KEY_CHECKS = 1;