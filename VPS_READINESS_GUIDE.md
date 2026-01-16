
# 🚀 GUIA DE DEPLOY S.I.E PRO - PROTOCOLO SRE V45.0

Este documento descreve as etapas para instalar o Kernel S.I.E na VPS Linux (Ubuntu Server) configurada.

## 1. REQUISITOS DE HARDWARE (MÍNIMO)
- 2 vCPU
- 4GB RAM
- 40GB SSD
- Ubuntu 22.04 LTS

## 2. PREPARAÇÃO DO SISTEMA (ONE-LINER)
Execute como root/sudo para instalar o stack base:
```bash
sudo apt update && sudo apt install -y curl git nginx mysql-server && curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs && sudo npm install -g pm2
```

## 3. CONFIGURAÇÃO DO BANCO DE DADOS
Acesse o MySQL e crie a base do sistema:
```sql
CREATE DATABASE siecacaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'siecacaria'@'localhost' IDENTIFIED BY 'Gegerminal180';
GRANT ALL PRIVILEGES ON siecacaria.* TO 'siecacaria'@'localhost';
FLUSH PRIVILEGES;
```

## 4. INSTALAÇÃO DA APLICAÇÃO
```bash
cd /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space
git clone https://github.com/EduG2025/S.I.E-Sistema-Ass-Moradores.git .
npm install
npm run build
```

## 5. INICIALIZAÇÃO DO SERVIÇO (PM2)
```bash
pm2 start server.js --name "sie-kernel"
pm2 save
pm2 startup
```
## - 5.1 Atualizar do Github (SRE RECOVERY)
```bash
git pull origin main
# Caso ocorra erro de build/Rollup, execute a limpeza:
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart all
pm2 logs
```

## 6. CONFIGURAÇÃO NGINX & SSL (VHOST)
Arquivo: `/etc/nginx/sites-available/admcacaria.jennyai.space`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name admcacaria.jennyai.space;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name admcacaria.jennyai.space;

    root /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/admcacaria.jennyai.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admcacaria.jennyai.space/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API (PRIORIDADE)
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Ative o site e reinicie o Nginx:
```bash
ln -s /etc/nginx/sites-available/admcacaria.jennyai.space /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

## 7. MONITORAMENTO
```bash
pm2 logs sie-kernel
```
