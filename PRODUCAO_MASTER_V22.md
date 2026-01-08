# 🚀 PROTOCOLO DE PRODUÇÃO S.I.E PRO V22.0

Este documento contém os comandos necessários para a preparação total da VPS.

## 1. PREPARAÇÃO DO AMBIENTE (ONE-LINER)
```bash
sudo apt update && sudo apt upgrade -y && \
sudo apt install -y curl git nginx mysql-server build-essential && \
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && \
sudo apt install -y nodejs && \
sudo npm install -g pm2
```

## 2. CONFIGURAÇÃO DO BANCO DE DADOS
```bash
sudo mysql -e "CREATE DATABASE siecacaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'siecacaria'@'localhost' IDENTIFIED BY 'Gegerminal180';"
sudo mysql -e "GRANT ALL PRIVILEGES ON siecacaria.* TO 'siecacaria'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

## 3. INSTALAÇÃO E COMPILAÇÃO
```bash
mkdir -p /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space
cd /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space
git clone https://github.com/EduG2025/S.I.E-Sistema-Ass-Moradores.git .
npm install
npm run build
```

## 4. VARIÁVEIS DE AMBIENTE (.env)
```env
PORT=3001
DB_HOST=127.0.0.1
DB_USER=siecacaria
DB_PASS=Gegerminal180
DB_NAME=siecacaria
JWT_SECRET=sua_chave_secreta_segura
API_KEY=sua_chave_gemini_api
```

## 5. INICIALIZAÇÃO DO SERVIÇO (PM2)
```bash
pm2 start server.js --name "sie-kernel"
pm2 save
pm2 startup
```

## 6. PROXY REVERSO NGINX (SSL)
Crie a configuração em `/etc/nginx/sites-available/admcacaria.jennyai.space`:

```nginx
server {
    listen 80;
    server_name admcacaria.jennyai.space;
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name admcacaria.jennyai.space;

    root /home/jennyai-admcacaria/htdocs/admcacaria.jennyai.space/dist;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/admcacaria.jennyai.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admcacaria.jennyai.space/privkey.pem;

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 7. VERIFICAÇÃO FINAL
```bash
pm2 status
sudo systemctl restart nginx
```