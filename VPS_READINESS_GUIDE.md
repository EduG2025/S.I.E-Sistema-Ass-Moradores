
# 🚀 GUIA DE DEPLOY S.I.E PRO - PROTOCOLO SRE V45.0

Este documento descreve as etapas para instalar o Kernel S.I.E em uma VPS Linux (Ubuntu Server).

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
*Importante: Aplique o conteúdo do arquivo `Schema.md` e `seed.md` após criar a base.*

## 4. INSTALAÇÃO DA APLICAÇÃO
```bash
cd /var/www
git clone <seu-repositorio> sie-pro
cd sie-pro
npm install
npm run build
```

## 5. INICIALIZAÇÃO DO KERNEL (PM2)
O PM2 garante que o sistema reinicie automaticamente em caso de falha ou reboot da VPS:
```bash
pm2 start server.js --name "sie-kernel"
pm2 save
pm2 startup
```

## 6. CONFIGURAÇÃO NGINX (PROXY REVERSO)
Crie o arquivo `/etc/nginx/sites-available/sie-pro`:
```nginx
server {
    listen 80;
    server_name seu_dominio.com;

    client_max_body_size 50M;

    location / {
        root /var/www/sie-pro/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Ative o site e reinicie o Nginx:
```bash
ln -s /etc/nginx/sites-available/sie-pro /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

## 7. MONITORAMENTO
Acompanhe os logs em tempo real:
```bash
pm2 logs sie-kernel
```
