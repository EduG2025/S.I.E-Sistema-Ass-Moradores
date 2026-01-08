# 🚀 PROTOCOLO DE PRODUÇÃO S.I.E PRO V22.0

Este documento contém os comandos necessários para a preparação total da VPS. 
**Atenção:** Siga a ordem rigorosamente para garantir a integridade do Kernel.

## 1. PREPARAÇÃO DO AMBIENTE (ONE-LINER)
Copie e cole este bloco no terminal da sua VPS (Ubuntu 22.04+):

```bash
sudo apt update && sudo apt upgrade -y && \
sudo apt install -y curl git nginx mysql-server build-essential && \
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && \
sudo apt install -y nodejs && \
sudo npm install -g pm2
```

## 2. CONFIGURAÇÃO DO BANCO DE DADOS
Acesse o console do MySQL:
```bash
sudo mysql
```

Dentro do MySQL, execute:
```sql
CREATE DATABASE siecacaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'siecacaria'@'localhost' IDENTIFIED BY 'Gegerminal180';
GRANT ALL PRIVILEGES ON siecacaria.* TO 'siecacaria'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3. INSTALAÇÃO E COMPILAÇÃO
Navegue até a pasta de destino (ex: /var/www):
```bash
cd /var/www
git clone <URL_DO_REPOSITORIO> sie-pro
cd sie-pro
npm install
npm run build
```

## 4. VARIÁVEIS DE AMBIENTE (.env)
Crie o arquivo de configuração:
```bash
nano .env
```
Cole e ajuste as variáveis:
```env
PORT=3001
DB_HOST=127.0.0.1
DB_USER=siecacaria
DB_PASS=Gegerminal180
DB_NAME=siecacaria
JWT_SECRET=sua_chave_secreta_longa_e_segura_aqui
API_KEY=sua_chave_gemini_api_aqui
```

## 5. INICIALIZAÇÃO DO SERVIÇO (SRE PROTOCOL)
Inicie o Kernel usando o PM2 para garantir resiliência 24/7:
```bash
pm2 start server.js --name "sie-kernel"
pm2 save
pm2 startup
```

## 6. PROXY REVERSO NGINX
Configure o Nginx para rotear o tráfego da porta 80 para a 3001:
```bash
sudo nano /etc/nginx/sites-available/sie-pro
```
Cole a configuração:
```nginx
server {
    listen 80;
    server_name seu_dominio_ou_ip.com;

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
Ative e reinicie:
```bash
sudo ln -s /etc/nginx/sites-available/sie-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. VERIFICAÇÃO DE SAÚDE
Verifique se os processos estão rodando:
```bash
pm2 status
pm2 logs sie-kernel
```
