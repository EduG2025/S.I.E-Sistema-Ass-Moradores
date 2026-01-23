# 🚀 S.I.E PRO - VPS READINESS GUIDE V240.2

Este guia detalha os requisitos para hospedar o Kernel S.I.E PRO em servidores VPS Linux.

## 🏗️ 1. REQUISITOS MÍNIMOS
- **SO**: Ubuntu 22.04 LTS ou Debian 12.
- **Hardware**: 2 vCPU / 4GB RAM (Recomendado para motor Recharts/Gemini).
- **Banco de Dados**: MySQL 8.0+.
- **Ambiente**: Node.js 20+ / PM2.

## 🛡️ 2. PREPARAÇÃO DO SISTEMA
Execute os comandos abaixo para preparar o cluster:

```bash
# Instalar Stack Base
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx mysql-server build-essential

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 Global
sudo npm install -g pm2
```

## 🏛️ 3. BANCO DE DADOS (CONTRATO V240.2)
Crie a base com suporte a UTF8MB4 para emojis e caracteres especiais:

```sql
CREATE DATABASE siecacaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'siecacaria'@'localhost' IDENTIFIED BY 'Gegerminal180';
GRANT ALL PRIVILEGES ON siecacaria.* TO 'siecacaria'@'localhost';
FLUSH PRIVILEGES;
```

## 🚀 4. DEPLOY EXPRESSO
Use o script de automação incluído:

```bash
cd /diretorio/do/projeto
npm run vps-deploy
```

## 📄 5. CONFIGURAÇÃO NGINX (SPA READY)
Crie o arquivo em `/etc/nginx/sites-available/sie-pro`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /home/usuario/sie-pro/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔍 6. MONITORAMENTO SRE
- **Logs do Kernel**: `pm2 logs sie-kernel`
- **Dashboard PM2**: `pm2 monit`
- **Saúde do MySQL**: `systemctl status mysql`

---
**Status do Cluster:** 🟢 READY FOR V240.2
