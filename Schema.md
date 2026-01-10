-- ---------------------------------------------------------
-- S.I.E PRO - SCHEMA MESTRE DE PRODUÇÃO V27.0 (FULL STACK)
-- ---------------------------------------------------------
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Configurações Globais
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) DEFAULT 'S.I.E PRO',
  `cnpj` VARCHAR(20),
  `address` TEXT,
  `logoUrl` LONGTEXT
) ENGINE=InnoDB;

-- 2. Usuários e Identidade
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100),
  `cpf_cnpj` VARCHAR(20) NOT NULL UNIQUE,
  `unit` VARCHAR(50),
  `role` VARCHAR(50) DEFAULT 'RESIDENT',
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `socialData` JSON,
  `avatar_url` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Governança & IA
CREATE TABLE IF NOT EXISTS `governance_matrix` (
  `role` VARCHAR(50) NOT NULL PRIMARY KEY,
  `permissions` JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ai_keys` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100),
  `key_value` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(50) DEFAULT 'GEMINI',
  `tier` VARCHAR(20) DEFAULT 'FREE',
  `priority` INT DEFAULT 1,
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `error_count` INT DEFAULT 0,
  `last_checked` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Studio & Templates (CORREÇÃO ERRO TEMPLATES)
CREATE TABLE IF NOT EXISTS `templates` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `width` INT DEFAULT 320,
  `height` INT DEFAULT 200,
  `orientation` VARCHAR(20) DEFAULT 'landscape',
  `frontBackground` LONGTEXT,
  `backBackground` LONGTEXT,
  `elements` JSON NOT NULL
) ENGINE=InnoDB;

-- 5. Financeiro (ERP)
CREATE TABLE IF NOT EXISTS `financials` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `description` VARCHAR(255),
  `amount` DECIMAL(15,2),
  `type` ENUM('INCOME', 'EXPENSE'),
  `category` VARCHAR(100),
  `date` DATE,
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `user_id` BIGINT,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- 6. Operacional (Watchdog & Mural)
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `location` VARCHAR(100),
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH'),
  `status` VARCHAR(50) DEFAULT 'OPEN',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `notices` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `content` TEXT,
  `urgency` VARCHAR(20),
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Planejamento (Timeline & Reservas)
CREATE TABLE IF NOT EXISTS `agenda` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `date` DATETIME,
  `type` VARCHAR(50),
  `status` VARCHAR(50) DEFAULT 'UPCOMING'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `area_name` VARCHAR(100),
  `date` DATE,
  `startTime` TIME,
  `endTime` TIME,
  `status` VARCHAR(50) DEFAULT 'APPROVED',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

-- 8. Projetos & Ativos
CREATE TABLE IF NOT EXISTS `projects` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `budget` DECIMAL(15,2),
  `spent` DECIMAL(15,2) DEFAULT 0,
  `progress` INT DEFAULT 0,
  `status` VARCHAR(50),
  `category` VARCHAR(50),
  `startDate` DATE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `assets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200),
  `category` VARCHAR(100),
  `value` DECIMAL(15,2),
  `status` VARCHAR(50),
  `date_acquired` DATE,
  `responsible_id` BIGINT
) ENGINE=InnoDB;

-- 9. Social & Censo
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `type` VARCHAR(50),
  `status` VARCHAR(50) DEFAULT 'ACTIVE'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `survey_questions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `survey_id` BIGINT,
  `text` TEXT,
  `type` VARCHAR(20),
  `options` JSON,
  FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Marketplace & Sugestões
CREATE TABLE IF NOT EXISTS `marketplace_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `category` VARCHAR(50),
  `price` DECIMAL(10,2),
  `whatsapp` VARCHAR(20),
  `merchant_id` BIGINT,
  FOREIGN KEY (`merchant_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `title` VARCHAR(200),
  `content` TEXT,
  `category` VARCHAR(50),
  `sentiment` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;