
# 🏛️ ESQUEMA DE DADOS & SEED S.I.E PRO (V190.1)

Este documento contém o protocolo completo para instalação do banco de dados MySQL 8.0 em ambientes de produção ou homologação VPS.

---

## 🏗️ 1. DEFINIÇÃO DE TABELAS (DDL)

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- MÓDULO 0: CONFIGURAÇÕES NUCLEARES (SINGLETON)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT PRIMARY KEY,
  `name` VARCHAR(255) DEFAULT 'Associação Residencial S.I.E',
  `shortName` VARCHAR(50) DEFAULT 'S.I.E PRO',
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

-- MÓDULO 1: IDENTIDADE & RBAC
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
  `age` INT, -- SRE UPDATE: Atributo biográfico para BI Populacional
  `phone` VARCHAR(50),
  `avatar_url` LONGTEXT,
  `socialData` JSON DEFAULT NULL,
  `coordinates` JSON DEFAULT NULL,
  `rg` VARCHAR(50),
  `address` TEXT,
  `profession` VARCHAR(255),
  `parent_id` INT DEFAULT NULL,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_unique_cpf` (`cpf_cnpj`),
  UNIQUE KEY `idx_unique_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MÓDULO 2: ERP FINANCEIRO
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
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MÓDULO 3: GOVERNANÇA & DOCUMENTAÇÃO
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT,
  `type` VARCHAR(50),
  `status` VARCHAR(20) DEFAULT 'DRAFT',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `assemblies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `date` DATETIME,
  `status` VARCHAR(20) DEFAULT 'SCHEDULED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MÓDULO 4: OPERACIONAL (WATCHDOG)
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
  `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cameras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255),
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MÓDULO 5: COMUNIDADE & ECONOMIA
CREATE TABLE IF NOT EXISTS `marketplace` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `merchant_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(50),
  `price` DECIMAL(15,2) DEFAULT 0,
  `whatsapp` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `area_name` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `startTime` TIME,
  `endTime` TIME,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MÓDULO 6: CENSO & BI
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
  `cpf` VARCHAR(20),
  `answers` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MÓDULO 7: INFRAESTRUTURA IA & AUDITORIA SRE
CREATE TABLE IF NOT EXISTS `ai_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `label` VARCHAR(100),
  `key_value` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(50) DEFAULT 'GOOGLE',
  `status` VARCHAR(20) DEFAULT 'ACTIVE',
  `priority` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `action` VARCHAR(50) NOT NULL,
  `table_name` VARCHAR(50) NOT NULL,
  `record_id` INT,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
```

---

## 🧪 2. SEED DE HIDRATAÇÃO (DADOS INICIAIS)

Copie e execute o bloco abaixo para configurar o ambiente inicial:

```sql
-- 1. CONFIGURAÇÕES GERAIS
INSERT INTO `settings` (`id`, `name`, `shortName`, `primaryColor`, `registrationMode`, `resident_ui_settings`) 
VALUES (1, 'Associação de Moradores S.I.E', 'S.I.E PRO', '#4f46e5', 'APPROVAL', 
'[{"id":"finance","label":"Financeiro","enabled":true,"icon":"Wallet","detail":"Faturas e pagamentos"},{"id":"reservations","label":"Reservas","enabled":true,"icon":"Calendar","detail":"Áreas comuns"},{"id":"notices","label":"Mural","enabled":true,"icon":"Bell","detail":"Avisos importantes"},{"id":"chat","label":"IA Advisor","enabled":true,"icon":"Brain","detail":"Assistente de governança"}]');

-- 2. USUÁRIO ADMINISTRADOR MESTRE
-- Senha Padrão SRE: Gegerminal180
INSERT INTO `users` (`name`, `email`, `cpf_cnpj`, `password_hash`, `role`, `status`, `active`, `unit`) 
VALUES ('ADMINISTRADOR KERNEL', 'admin@sie.pro', '00000000000', '$2a$10$7Z8l8Y2u3uO7pW4K5v6v6.W9O1JjE5P6U8Y5u3uO7pW4K5v6v6', 'ADMIN', 'ACTIVE', 1, 'HUB-SRE');

-- 3. PRIMEIRO CENSO (EXEMPLO)
INSERT INTO `surveys` (`title`, `description`, `questions`, `status`) 
VALUES ('Censo Socioeconômico 2025', 'Mapeamento demográfico oficial do cluster para fins de governança social.', 
'[{"id":"q1","text":"Quantas pessoas residem na unidade?","type":"number","required":true,"mapping_tag":"HOUSEHOLD"},{"id":"q2","text":"Possui algum membro com deficiência (PCD)?","type":"boolean","required":true,"mapping_tag":"VULNERABILITY"},{"id":"q3","text":"Renda familiar mensal aproximada?","type":"select","options":["ATÉ 2 SM","2 a 5 SM","ACIMA DE 5 SM"],"required":true,"mapping_tag":"INCOME"}]', 'ACTIVE');
```
