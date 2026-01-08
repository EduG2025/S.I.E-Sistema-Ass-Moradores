
-- ---------------------------------------------------------
-- S.I.E PRO - SCHEMA MESTRE DE PRODUÇÃO V22.5 (18 MÓDULOS)
-- ---------------------------------------------------------
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Configurações e Governança
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) DEFAULT 'S.I.E PRO',
  `cnpj` VARCHAR(20),
  `address` TEXT,
  `logoUrl` LONGTEXT
) ENGINE=InnoDB;

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
  `avatar_url` LONGTEXT,
  `socialData` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Financeiro
CREATE TABLE IF NOT EXISTS `financials` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `status` VARCHAR(50) DEFAULT 'PENDING',
  `category` VARCHAR(100),
  `date` DATETIME NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Operacional
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `location` VARCHAR(100),
  `priority` VARCHAR(20),
  `status` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `notices` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT,
  `urgency` VARCHAR(20),
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Governança de Documentos e Assembleias
CREATE TABLE IF NOT EXISTS `documents` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `content` LONGTEXT,
  `type` VARCHAR(50),
  `status` VARCHAR(50),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `assemblies` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `date` DATETIME,
  `status` VARCHAR(50),
  `ata_content` LONGTEXT
) ENGINE=InnoDB;

-- Patrimônio e Projetos
CREATE TABLE IF NOT EXISTS `assets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200),
  `category` VARCHAR(100),
  `value` DECIMAL(15,2),
  `status` VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `budget` DECIMAL(15,2),
  `spent` DECIMAL(15,2),
  `progress` INT,
  `status` VARCHAR(50),
  `category` VARCHAR(50)
) ENGINE=InnoDB;

-- Planejamento
CREATE TABLE IF NOT EXISTS `agenda` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `date` DATETIME,
  `type` VARCHAR(50),
  `status` VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `area_name` VARCHAR(100),
  `date` DATE,
  `startTime` TIME,
  `endTime` TIME,
  `status` VARCHAR(20) DEFAULT 'APPROVED',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Social e Comunitário
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200),
  `description` TEXT,
  `type` VARCHAR(50),
  `status` VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `marketplace_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` BIGINT,
  `title` VARCHAR(200),
  `description` TEXT,
  `category` VARCHAR(50),
  `price` DECIMAL(15,2),
  `whatsapp` VARCHAR(20),
  FOREIGN KEY (`merchant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `title` VARCHAR(200),
  `content` TEXT,
  `category` VARCHAR(50),
  `sentiment` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
