
# 🏛️ PROTOCOLO DE MIGRAÇÃO SQL - S.I.E PRO V102.5

Este documento contém os comandos necessários para alinhar o banco de dados com a última auditoria de **Censo e Auditoria Financeira**.

## 1. ACESSO SSH / TERMINAL
Conecte-se ao banco de dados via terminal na sua VPS:
```bash
mysql -u siecacaria -p siecacaria
```

## 2. SCRIPT DE ATUALIZAÇÃO (COPIE E COLE)
Execute o bloco abaixo para garantir a integridade do Kernel:

```sql
-- ---------------------------------------------------------
-- SRE DATABASE SYNC - V2.9.1
-- ---------------------------------------------------------

-- 1. Otimização de Busca de Moradores (CPF)
-- Garante que o Handshake do Censo seja instantâneo e sem duplicidade
ALTER TABLE `users` MODIFY COLUMN `cpf_cnpj` VARCHAR(20) NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS `idx_unique_cpf` ON `users` (`cpf_cnpj`);

-- 2. Reforço da Tabela de Auditoria
-- Necessário para a nova aba "Trilha de Auditoria" no Financeiro
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(50) NOT NULL,
  `table_name` VARCHAR(50) NOT NULL,
  `record_id` INT DEFAULT NULL,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_table` (`table_name`, `record_id`),
  INDEX `idx_audit_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Padronização Financeira (Recorrência)
-- Corrige a divergência de tipos apontada na auditoria de TypeScript
ALTER TABLE `financials` MODIFY COLUMN `is_recurring` TINYINT(1) DEFAULT 0;
ALTER TABLE `financials` ADD COLUMN IF NOT EXISTS `billing_cycle` VARCHAR(50) DEFAULT NULL;

-- 4. Registro de Versão de Schema
INSERT INTO `settings` (`id`, `shortName`) VALUES (1, 'SIE PRO') ON DUPLICATE KEY UPDATE `shortName` = 'SIE PRO';

-- ---------------------------------------------------------
-- FIM DO PROTOCOLO SRE
-- ---------------------------------------------------------
```

## 3. VERIFICAÇÃO DE SAÚDE
Após executar, o Kernel deve reportar:
`✅ SRE KERNEL DATABASE SYNCED | STATUS: 200 OK`
