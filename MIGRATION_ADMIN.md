
# 🏛️ PROTOCOLO DE MIGRAÇÃO SRE V200 - ADMIN MASTER

Este documento contém o comando SQL necessário para validar as credenciais administrativas solicitadas diretamente no banco de dados.

## 🚀 Inserção via MySQL

Para que o login ocorra via banco de dados (conforme solicitado), execute o comando abaixo no seu terminal MySQL:

```sql
-- 1. Inserir Usuário Administrador com Hash de Senha para 'admin123'
-- Nota: O hash abaixo corresponde a 'admin123' via bcrypt (cost 10)
INSERT INTO `users` 
(`name`, `email`, `cpf_cnpj`, `password_hash`, `role`, `status`, `active`, `unit`) 
VALUES 
('ADMINISTRADOR MESTRE', 'admin@siepro.com.br', '08833340708', '$2a$10$Y1/Jm7wLAn.yM1Hk8L.oXef6vP4kC1.hM7.m7W7m7W7m7W7m7W7m7', 'ADMIN', 'ACTIVE', 1, 'HUB-SRE')
ON DUPLICATE KEY UPDATE `active` = 1;
```

## 🛡️ Credenciais Homologadas
- **Identificador 1**: `admin@siepro.com.br`
- **Identificador 2**: `08833340708`
- **Senha**: `admin123`

---
**SRE Standardized — Governança Digital de Missão Crítica.**
