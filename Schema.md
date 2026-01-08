
-- ---------------------------------------------------------
-- S.I.E PRO - SCHEMA MESTRE DE PRODUÇÃO V22.0
-- ---------------------------------------------------------
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) DEFAULT 'S.I.E PRO',
  `cnpj` VARCHAR(20),
  `address` TEXT,
  `email` VARCHAR(100),
  `phone` VARCHAR(20),
  `logoUrl` LONGTEXT,
  `registrationMode` VARCHAR(20) DEFAULT 'APPROVAL',
  `primaryColor` VARCHAR(20) DEFAULT '#4f46e5'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100),
  `phone` VARCHAR(20),
  `cpf_cnpj` VARCHAR(20) NOT NULL UNIQUE,
  `unit` VARCHAR(50),
  `role` VARCHAR(50) DEFAULT 'RESIDENT',
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `avatar_url` LONGTEXT,
  `socialData` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `financials` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `status` ENUM('PAID', 'PENDING', 'OVERDUE') DEFAULT 'PENDING',
  `category` VARCHAR(100),
  `date` DATETIME NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `incidents` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `location` VARCHAR(100),
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `marketplace_items` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` BIGINT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(50),
  `price` DECIMAL(15,2),
  `whatsapp` VARCHAR(20),
  FOREIGN KEY (`merchant_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `area_name` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `startTime` TIME,
  `endTime` TIME,
  `status` VARCHAR(20) DEFAULT 'APPROVED',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `suggestions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `title` VARCHAR(200),
  `content` TEXT,
  `category` VARCHAR(50),
  `sentiment` VARCHAR(20) DEFAULT 'NEUTRO',
  `upvotes` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `assemblies` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `date` DATETIME,
  `description` TEXT,
  `status` VARCHAR(20) DEFAULT 'SCHEDULED',
  `ata_content` LONGTEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `roles_permissions` (
  `role` VARCHAR(50) PRIMARY KEY,
  `permissions` JSON
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ai_keys` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100),
  `key_value` VARCHAR(255),
  `provider` VARCHAR(50),
  `tier` VARCHAR(20),
  `priority` INT,
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `error_count` INT DEFAULT 0,
  `last_checked` TIMESTAMP NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
