# 🧪 SCRIPT DE HIDRATAÇÃO S.I.E PRO V260.0 (RBAC UPDATE)

Este script consolida a hierarquia administrativa e operacional conforme diretrizes SRE.

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. IDENTIDADE VISUAL & WHATSAPP BRIDGE
INSERT INTO `settings` (`id`, `name`, `shortName`, `primaryColor`, `registrationMode`, `whatsapp_config`) 
VALUES (1, 'Associação Central S.I.E', 'S.I.E PRO', '#4f46e5', 'APPROVAL', 
'{"api_key": "", "sender": "", "footer": "S.I.E PRO", "welcome_template": "Olá {nome}, bem-vindo ao S.I.E PRO. Sua senha de acesso é: {senha}", "default_password": "mudar123"}')
ON DUPLICATE KEY UPDATE `shortName` = `shortName`;

-- 2. CARGOS HIERÁRQUICOS MASTER (RBAC)
INSERT IGNORE INTO `roles` (`id`, `label`) VALUES 
('ADMIN', 'Administrador Master'),
('PRESIDENT', 'Presidente'),
('VICE_PRESIDENT', 'Vice-Presidente'),
('SECRETARY', 'Secretário(a)'),
('TREASURER', 'Tesoureiro(a)'),
('SERVICE', 'Atendimento / Recepção'),
('RESIDENT', 'Morador Titular'),
('VISITOR', 'Visitante Externo');

-- 3. MATRIZ DE PERMISSÕES SUGESTIVAS (AUDITORIA INICIAL)
-- Administrador: Acesso Total
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES ('ADMIN', '*');

-- Presidente: Autonomia total exceto Configurações de Kernel (Acesso Negado)
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES 
('PRESIDENT', 'view_dashboard'), ('PRESIDENT', 'manage_users'), ('PRESIDENT', 'view_finances'), ('PRESIDENT', 'manage_finances'),
('PRESIDENT', 'view_operations'), ('PRESIDENT', 'use_ai_chat'), ('PRESIDENT', 'view_documents'), ('PRESIDENT', 'manage_assemblies'), 
('PRESIDENT', 'view_projects'), ('PRESIDENT', 'use_marketplace'), ('PRESIDENT', 'use_reservations'), ('PRESIDENT', 'manage_surveys'), 
('PRESIDENT', 'manage_communication'), ('PRESIDENT', 'view_timeline'), ('PRESIDENT', 'send_suggestions'), ('PRESIDENT', 'view_demographics');

-- Vice-Presidente: Apoio administrativo e operacional
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES 
('VICE_PRESIDENT', 'view_dashboard'), ('VICE_PRESIDENT', 'view_operations'), ('VICE_PRESIDENT', 'view_timeline'), 
('VICE_PRESIDENT', 'view_documents'), ('VICE_PRESIDENT', 'manage_assemblies'), ('VICE_PRESIDENT', 'use_ai_chat'), 
('VICE_PRESIDENT', 'use_marketplace'), ('VICE_PRESIDENT', 'use_reservations'), ('VICE_PRESIDENT', 'manage_communication'), 
('VICE_PRESIDENT', 'send_suggestions');

-- Tesoureiro: Foco em ERP e Projetos
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES 
('TREASURER', 'view_dashboard'), ('TREASURER', 'view_finances'), ('TREASURER', 'view_projects'), ('TREASURER', 'manage_finances');

-- Secretário: Foco em Governança e Comunicação
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES 
('SECRETARY', 'view_dashboard'), ('SECRETARY', 'view_documents'), ('SECRETARY', 'manage_assemblies'), 
('SECRETARY', 'manage_surveys'), ('SECRETARY', 'manage_communication'), ('SECRETARY', 'use_ai_chat'), 
('SECRETARY', 'send_suggestions');

-- Atendimento: Portaria e Facilidades
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES 
('SERVICE', 'view_dashboard'), ('SERVICE', 'view_operations'), ('SERVICE', 'manage_communication'), 
('SERVICE', 'send_suggestions'), ('SERVICE', 'use_marketplace'), ('SERVICE', 'use_reservations');

-- Morador: Uso comunitário básico
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES 
('RESIDENT', 'view_dashboard'), ('RESIDENT', 'use_marketplace'), ('RESIDENT', 'use_reservations'), 
('RESIDENT', 'send_suggestions'), ('RESIDENT', 'view_timeline');

-- Visitante: Visualização externa apenas
INSERT IGNORE INTO `role_permissions` (`role`, `permission_id`) VALUES ('VISITOR', 'use_marketplace');

-- 4. USUÁRIO ADMINISTRADOR MASTER (Acesso Recovery)
-- Senha: admin123
INSERT INTO `users` (`name`, `cpf_cnpj`, `email`, `role`, `status`, `active`, `unit`, `age`, `socialData`, `coordinates`, `password_hash`) 
VALUES 
('ADMINISTRADOR KERNEL', '08833340708', 'admin@siepro.com.br', 'ADMIN', 'ACTIVE', 1, 'HUB-SRE', 45, '{"risk": 5, "tags": ["SRE_CORE"]}', '{"lat": -23.5505, "lng": -46.6333}', '$2a$10$Y1/Jm7wLAn.yM1Hk8L.oXef6vP4kC1.hM7.m7W7m7W7m7W7m7W7m7')
ON DUPLICATE KEY UPDATE `role` = 'ADMIN';

SET FOREIGN_KEY_CHECKS = 1;
```
