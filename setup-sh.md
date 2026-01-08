
# 🚀 PROTOCOLO DE DEPLOY S.I.E PRO V22.0 (SRE)

## 1. PREPARAÇÃO DO SISTEMA
```bash
# Atualizar pacotes e dependências de build
sudo apt update && sudo apt install -y build-essential git curl nginx

# Instalar Node.js 20 (LTS) se necessário
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. CONFIGURAÇÃO DO REVERSE PROXY (NGINX)
Crie o arquivo `/etc/nginx/sites-available/sie-pro`:
```nginx
server {
    listen 80;
    server_name seu_dominio.com;

    # CORREÇÃO SRE: Permitir payloads grandes para Logos e Documentos
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

## 3. ONE-LINER DE MIGRAÇÃO E BUILD (IDEMPOTENTE)
```bash
# Executar na raiz do projeto
npm install && npm run build && pm2 restart server.js --name "sie-api" || pm2 start server.js --name "sie-api"
```

## 4. MONITORAMENTO DE SAÚDE
```bash
pm2 monit
# Ou para logs em tempo real
pm2 logs sie-api
```
