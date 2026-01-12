
-- ---------------------------------------------------------
-- S.I.E PRO - MASTER RECOVERY & HYDRATION SCRIPT V42.2
-- PROTOCOLO SRE: POPULAÇÃO TOTAL DE AMBIENTE CRÍTICO
-- ---------------------------------------------------------

SET NAMES utf8mb4;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- 1. CONFIGURAÇÕES NUCLEARES
DELETE FROM `settings`;
INSERT INTO `settings` (`id`, `name`, `shortName`, `cnpj`, `address`, `email`, `phone`, `primaryColor`, `registrationMode`) 
VALUES (1, 'Associação Residencial S.I.E - Cluster 01', 'S.I.E PRO', '00.123.456/0001-99', 'Av. das Palmeiras, 1000 - Setor Alfa', 'governanca@sie.pro', '(11) 4002-8922', '#4f46e5', 'APPROVAL');

-- [RESTANTE DO ARQUIVO MANTIDO...]
