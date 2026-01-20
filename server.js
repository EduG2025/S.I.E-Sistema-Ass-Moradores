
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
 * SRE SCHEMA ENFORCEMENT - PROTOCOLO TOTAL V530.1
 * Inclusão de campo age para bioestatística de membros.
 */
const ensureSchema = async () => {
    try {
        const sqls = [
            // CORE & SETTINGS
            'CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), address TEXT, email VARCHAR(100), phone VARCHAR(50), website VARCHAR(255), primaryColor VARCHAR(20), registrationMode VARCHAR(20), logoUrl LONGTEXT, resident_ui_settings JSON, whatsapp_config JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id))',
            
            // USERS & IDENTITY (SRE UPDATE: Added age field)
            'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, cpf_cnpj VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255), password_hash VARCHAR(255), role VARCHAR(50) DEFAULT "RESIDENT", status VARCHAR(20) DEFAULT "PENDING", active TINYINT(1) DEFAULT 0, unit VARCHAR(50), age INT, phone VARCHAR(50), avatar_url LONGTEXT, socialData JSON, coordinates JSON, parent_id INT, last_login DATETIME, address TEXT, neighborhood VARCHAR(100), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(20), profession VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)',
            
            // FINANCE & ASSETS
            'CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255) NOT NULL, amount DECIMAL(15,2) NOT NULL, type ENUM("INCOME", "EXPENSE") NOT NULL, category VARCHAR(100), status ENUM("PAID", "PENDING", "OVERDUE", "CANCELLED") DEFAULT "PENDING", is_recurring TINYINT(1) DEFAULT 0, billing_cycle VARCHAR(50), next_due_date DATE, date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS assets (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, category VARCHAR(100), value DECIMAL(15,2), status VARCHAR(50), date_acquired DATE, responsible_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // GOVERNANÇA & DOCUMENTS
            'CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, content LONGTEXT, type VARCHAR(50), status VARCHAR(20) DEFAULT "DRAFT", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS assemblies (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, date DATETIME, status VARCHAR(20) DEFAULT "SCHEDULED", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS prompt_templates (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            // OPERATIONAL & SECURITY
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, location VARCHAR(255), priority ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") DEFAULT "LOW", status ENUM("OPEN", "IN_PROGRESS", "RESOLVED") DEFAULT "OPEN", description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS cameras (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, url VARCHAR(255) NOT NULL, location VARCHAR(255), status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS visitors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, document VARCHAR(50), unit VARCHAR(50), phone VARCHAR(50), status VARCHAR(50), arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, exit_time TIMESTAMP NULL)',
            'CREATE TABLE IF NOT EXISTS deliveries (id INT AUTO_INCREMENT PRIMARY KEY, courier VARCHAR(255), company VARCHAR(255), unit VARCHAR(50), recipient VARCHAR(255), status VARCHAR(50), arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, pickup_time TIMESTAMP NULL)',
            
            // COMMUNITY & ENGAGEMENT
            'CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, merchant_id INT, title VARCHAR(255) NOT NULL, description TEXT, category VARCHAR(50), price DECIMAL(15,2) DEFAULT 0, whatsapp VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS reservations (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, area_name VARCHAR(100) NOT NULL, date DATE NOT NULL, startTime TIME, endTime TIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS suggestions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255), content TEXT, category VARCHAR(50), status VARCHAR(50) DEFAULT "OPEN", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS notices (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content TEXT, urgency VARCHAR(20), date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS agenda (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, type VARCHAR(50), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS projects (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, budget DECIMAL(15,2), spent DECIMAL(15,2), progress INT DEFAULT 0, startDate DATE, category VARCHAR(50), status VARCHAR(20))',
            
            // SURVEYS & IA
            'CREATE TABLE IF NOT EXISTS surveys (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, type VARCHAR(50) DEFAULT "CENSUS", questions JSON, status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS survey_responses (id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT, user_id INT, cpf VARCHAR(20), user_name VARCHAR(255), answers JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255) NOT NULL, provider VARCHAR(50) DEFAULT "GOOGLE", status VARCHAR(20) DEFAULT "ACTIVE", tier VARCHAR(10) DEFAULT "FREE", priority INT DEFAULT 1, error_count INT DEFAULT 0, last_checked DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS whatsapp_broadcast_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, target_role VARCHAR(50) DEFAULT "ALL", message_body TEXT NOT NULL, recipient_count INT DEFAULT 0, status ENUM("QUEUED", "PROCESSING", "COMPLETED", "FAILED") DEFAULT "QUEUED", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, target_type VARCHAR(20) NOT NULL, target_value VARCHAR(50), message_body TEXT NOT NULL, scheduled_at DATETIME NOT NULL, status VARCHAR(20) DEFAULT "PENDING", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
        ];
        
        for (const sql of sqls) await pool.query(sql);

        // Garante Registro de Configuração ID 1
        await pool.query('INSERT IGNORE INTO settings (id, name, shortName) VALUES (1, "Associação Residencial S.I.E", "S.I.E PRO")');

        // SEEDING DE PERMISSÕES
        const initialRoles = [
            ['ADMIN', 'Administrador Master'],
            ['PRESIDENT', 'Presidente / Diretor'],
            ['SINDIC', 'Síndico Profissional'],
            ['COUNCIL', 'Conselheiro'],
            ['RESIDENT', 'Morador Titular'],
            ['CONCIERGE', 'Portaria / Vigilância'],
            ['MERCHANT', 'Parceiro Local']
        ];
        for (const [id, label] of initialRoles) {
            await pool.query('INSERT IGNORE INTO roles (id, label) VALUES (?, ?)', [id, label]);
        }

        const criticalPermissions = [
            'view_dashboard', 'manage_users', 'view_finances', 'view_operations', 
            'manage_settings', 'manage_ai_keys', 'use_ai_chat', 'view_documents', 
            'manage_assemblies', 'view_projects', 'use_marketplace', 'use_reservations',
            'manage_surveys', 'manage_communication', 'view_timeline', 'send_suggestions',
            'view_demographics'
        ];
        for (const perm of criticalPermissions) {
            await pool.query('INSERT IGNORE INTO role_permissions (role, permission_id) VALUES ("ADMIN", ?)', [perm]);
        }

        // SRE HOTFIX: Ensure age column exists on existing installations
        try {
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT AFTER unit');
        } catch (e) { /* Coluna pode já existir */ }

        console.log("✅ SRE KERNEL: Integridade Operacional V530.1 Homologada.");
    } catch (e) { 
        console.error("❌ Schema Panic:", e.message); 
    }
};

app.use('/api', apiRoutes);

app.use('/assets', express.static(path.join(__dirname, 'dist/assets'), {
    immutable: true,
    maxAge: '1y',
    fallthrough: false
}));

app.use(express.static(path.join(__dirname, 'dist'), {
    index: false
}));

app.get('*', (req, res) => {
    if (req.path.includes('.') && !req.path.endsWith('.html')) {
        return res.status(404).end();
    }
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

/**
 * SRE HEARTBEAT CRON (MESSENGER AUTOMATION)
 */
setInterval(() => {
    processScheduledMessages().catch(err => console.error("[SRE HEARTBEAT FAIL]", err));
}, 60000);

const boot = async () => {
    try {
        await ensureSchema();
        app.listen(PORT, async () => {
            const [[s]] = await pool.query('SELECT name FROM settings WHERE id=1');
            console.log(`🚀 KERNEL ${s?.name || 'OPERACIONAL'} ATIVO NA PORTA ${PORT}`);
        });
    } catch (error) {
        console.error("🛑 CRITICAL KERNEL FAILURE:", error);
        process.exit(1);
    }
};

boot();
