#!/bin/bash
# 🚀 S.I.E PRO - VPS DEPLOYMENT PROTOCOL V240.3 (SRE)
# Este script automatiza a instalação e reinicialização do cluster.

echo "--------------------------------------------------------"
echo "  S.I.E PRO - SISTEMA INTELIGENTE ATIVO V240.3"
echo "  PROTOCOLO SRE DE DEPLOY EM AMBIENTE DE MISSÃO CRÍTICA"
echo "--------------------------------------------------------"

# 1. Auditoria de Permissões
echo "🔍 [1/5] Auditando permissões de diretório..."
sudo chown -R $USER:$USER .
sudo chmod -R 755 .

# 2. Instalação de Dependências
echo "📦 [2/5] Sincronizando dependências..."
# Garante que todos os módulos (incluindo plugins de build) sejam instalados
npm install

# 3. Compilação do Frontend
echo "🏗️ [3/5] Gerando build otimizado (Vite)..."
npm run build

# 4. Verificação de Integridade .env
echo "🛡️ [4/5] Verificando variáveis de ambiente..."
if [ ! -f .env ]; then
    echo "❌ ERRO CRÍTICO: Arquivo .env não localizado!"
    echo "Copie o .env.example para .env e preencha as credenciais do DB e IA."
    exit 1
fi
echo "✅ Ambiente validado."

# 5. Orquestração via PM2
echo "⚙️ [5/5] Reiniciando Kernel via PM2..."
pm2 restart sie-kernel || pm2 start server.js --name "sie-kernel"
pm2 save

echo "--------------------------------------------------------"
echo "🚀 CLUSTER OPERACIONAL! Verifique logs com: pm2 logs sie-kernel"
echo "--------------------------------------------------------"