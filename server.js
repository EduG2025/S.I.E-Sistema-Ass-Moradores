import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import apiRoutes from './routes/api.js';
import { processScheduledMessages } from './controllers/communicationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

/**
 * S.I.E MASTER KERNEL SCHEMA - PROTOCOLO SRE V8.5
 * Gestão Coletiva & Governança Digital
 */
const ensureSchema = async () => {
    try {
        const sqls = [
            // CORE & SETTINGS (SRE DYNAMIC HEADERS)
            'CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), address TEXT, email VARCHAR(100), phone VARCHAR(50), website VARCHAR(255), primaryColor VARCHAR(20), registrationMode VARCHAR(20), logoUrl LONGTEXT, resident_ui_settings JSON, whatsapp_config JSON, module_metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100) NOT NULL)',
            'CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id))',
            
            // COMUNICAÇÃO & TEMPLATES (NOVO CORE V8.5)
            'CREATE TABLE IF NOT EXISTS message_templates (id INT AUTO_INCREMENT PRIMARY KEY, event_trigger VARCHAR(50) UNIQUE, name VARCHAR(100), content TEXT, is_active TINYINT(1) DEFAULT 1, variables_available JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, target_type VARCHAR(20), target_value VARCHAR(100), message_body TEXT, template_id INT, scheduled_at DATETIME, status VARCHAR(20) DEFAULT "PENDING", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            // IDENTIDADE & SOCIAL
            'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, username VARCHAR(255), cpf_cnpj VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255), password_hash VARCHAR(255), role VARCHAR(50) DEFAULT "RESIDENT", status VARCHAR(20) DEFAULT "PENDING", active TINYINT(1) DEFAULT 1, unit VARCHAR(50), age INT, phone VARCHAR(50), avatar_url LONGTEXT, socialData JSON, coordinates JSON, address TEXT, neighborhood VARCHAR(100), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(20), profession VARCHAR(255), parent_id INT, last_login DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // FINANCEIRO
            'CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255) NOT NULL, amount DECIMAL(15,2) NOT NULL, type ENUM("INCOME", "EXPENSE") NOT NULL, category VARCHAR(100), status ENUM("PAID", "PENDING", "OVERDUE", "CANCELLED") DEFAULT "PENDING", is_recurring TINYINT(1) DEFAULT 0, billing_cycle VARCHAR(50), next_due_date DATE, date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // OPERACIONAL & COMUNIDADE
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, location VARCHAR(255), priority ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") DEFAULT "LOW", status ENUM("OPEN", "IN_PROGRESS", "RESOLVED") DEFAULT "OPEN", description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS reservations (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, area_name VARCHAR(255) NOT NULL, date DATE NOT NULL, startTime TIME, endTime TIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, merchant_id INT, title VARCHAR(255) NOT NULL, price DECIMAL(15,2) DEFAULT 0, category VARCHAR(50), whatsapp VARCHAR(20), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS suggestions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255) NOT NULL, content TEXT, category VARCHAR(50), status VARCHAR(20) DEFAULT "OPEN", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            // GOVERNANÇA & DOCUMENTOS
            'CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, content LONGTEXT, type VARCHAR(50), status VARCHAR(20) DEFAULT "DRAFT", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS assemblies (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, date DATETIME, status VARCHAR(20) DEFAULT "SCHEDULED", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS notices (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, content TEXT, urgency VARCHAR(20) DEFAULT "LOW", date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // IA & AUDITORIA
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255) NOT NULL, provider VARCHAR(50) DEFAULT "GOOGLE", status VARCHAR(20) DEFAULT "ACTIVE", priority INT DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            // CENSO
            'CREATE TABLE IF NOT EXISTS surveys (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, type VARCHAR(50) DEFAULT "CENSUS", questions JSON, status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS survey_responses (id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT, user_id INT, cpf VARCHAR(20), user_name VARCHAR(255), answers JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
        ];
        
        for (const sql of sqls) {
            await pool.query(sql);
        }

        // INITIAL METADATA FOR MODULES
        const initialMetadata = {
            dashboard: { title: "Painel de Controle", slogan: "Gestão Ativa e Soberana do Cluster" },
            users: { title: "Gestão de Membros", slogan: "Identidade e Hierarquia do Cluster" },
            finance: { title: "ERP Financeiro", slogan: "Transparência e Liquidez Comunitária" },
            governance: { title: "Assembleia & Atas", slogan: "Voto Digital e Governança Imutável" },
            watchdog: { title: "Vigia Digital", slogan: "Monitoramento Vision e Segurança" },
            marketplace: { title: "Vitrine Circular", slogan: "Economia e Fomento Comunitário" },
            communication: { title: "Canal de Voz", slogan: "Avisos e Messenger Gateway" }
        };

        // HIDRATAÇÃO INICIAL DE TEMPLATES
        const welcomeVars = JSON.stringify(['nome', 'sigla', 'senha', 'unidade']);
        const billingVars = JSON.stringify(['nome', 'valor', 'vencimento', 'link_boleto']);

        await pool.query('INSERT IGNORE INTO settings (id, name, shortName, primaryColor, module_metadata) VALUES (1, "Associação Residencial S.I.E", "S.I.E PRO", "#4f46e5", ?)', [JSON.stringify(initialMetadata)]);
        await pool.query('INSERT IGNORE INTO message_templates (event_trigger, name, content, variables_available) VALUES ("ONBOARDING", "Boas-vindas ao Cluster", "Olá {nome}, seja bem-vindo ao {sigla}! Sua unidade {unidade} está ativa. Sua senha inicial é: {senha}", ?)', [welcomeVars]);
        await pool.query('INSERT IGNORE INTO message_templates (event_trigger, name, content, variables_available) VALUES ("BILLING", "Lembrete de Taxa Associativa", "Prezado {nome}, identificamos uma taxa em aberto no valor de R$ {valor} com vencimento em {vencimento}. Acesse aqui: {link_boleto}", ?)', [billingVars]);
        
        await pool.query('INSERT IGNORE INTO roles (id, label) VALUES ("ADMIN", "Administrador Master"), ("RESIDENT", "Morador Titular")');
        await pool.query('INSERT IGNORE INTO role_permissions (role, permission_id) VALUES ("ADMIN", "*")');

        console.log("✅ KERNEL SRE: Schema V8.5 Sincronizado.");
    } catch (e) { 
        console.error("❌ Schema Panic:", e.message); 
    }
};

app.use('/api', apiRoutes);

setInterval(() => {
    processScheduledMessages();
}, 60000);

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const boot = async () => {
    try {
        await ensureSchema();
        app.listen(PORT, () => {
            console.log(`🚀 S.I.E PRO ACTIVE ON PORT ${PORT}`);
        });
    } catch (error) {
        console.error("🛑 BOOT FAILURE:", error);
        process.exit(1);
    }
};

boot();