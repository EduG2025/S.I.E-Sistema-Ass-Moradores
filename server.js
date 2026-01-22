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
 * S.I.E MASTER KERNEL SCHEMA - PROTOCOLO SRE V10.0 (EXPANSÃO DE IDENTIDADE & GOVERNANÇA)
 */
const ensureSchema = async () => {
    try {
        const sqls = [
            'CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), address TEXT, email VARCHAR(100), phone VARCHAR(50), website VARCHAR(255), primaryColor VARCHAR(20), registrationMode VARCHAR(20), logoUrl LONGTEXT, resident_ui_settings JSON, whatsapp_config JSON, module_metadata JSON, president_name VARCHAR(255), president_cpf VARCHAR(20), management_start DATE, management_end DATE, president_signature LONGTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100) NOT NULL)',
            'CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id))',
            'CREATE TABLE IF NOT EXISTS message_templates (id INT AUTO_INCREMENT PRIMARY KEY, event_trigger VARCHAR(50) UNIQUE, name VARCHAR(100), content TEXT, is_active TINYINT(1) DEFAULT 1, variables_available JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, target_type VARCHAR(20), target_value VARCHAR(100), message_body TEXT, template_id INT, scheduled_at DATETIME, status VARCHAR(20) DEFAULT "PENDING", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, username VARCHAR(255), cpf_cnpj VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255), password_hash VARCHAR(255), role VARCHAR(50) DEFAULT "RESIDENT", status VARCHAR(20) DEFAULT "PENDING", active TINYINT(1) DEFAULT 1, unit VARCHAR(50), age INT, phone VARCHAR(50), avatar_url LONGTEXT, socialData JSON, coordinates JSON, address TEXT, neighborhood VARCHAR(100), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(20), profession VARCHAR(255), parent_id INT, last_login DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, rg VARCHAR(50), issuing_authority VARCHAR(100))',
            'CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255) NOT NULL, amount DECIMAL(15,2) NOT NULL, type ENUM("INCOME", "EXPENSE") NOT NULL, category VARCHAR(100), status ENUM("PAID", "PENDING", "OVERDUE", "CANCELLED") DEFAULT "PENDING", is_recurring TINYINT(1) DEFAULT 0, billing_cycle VARCHAR(50), next_due_date DATE, date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, location VARCHAR(255), priority ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") DEFAULT "LOW", status ENUM("OPEN", "IN_PROGRESS", "RESOLVED") DEFAULT "OPEN", description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, merchant_id INT, title VARCHAR(255) NOT NULL, price DECIMAL(15,2) DEFAULT 0, category VARCHAR(50), whatsapp VARCHAR(20), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255) NOT NULL, provider VARCHAR(50) DEFAULT "GOOGLE", model VARCHAR(100) DEFAULT "gemini-3-flash-preview", tier VARCHAR(20) DEFAULT "FREE", status VARCHAR(20) DEFAULT "ACTIVE", priority INT DEFAULT 1, error_count INT DEFAULT 0, last_checked DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
        ];
        
        for (const sql of sqls) { await pool.query(sql); }

        // Migração de colunas faltantes em settings (Adição de Presidência)
        const settingsMigrations = [
            { col: 'president_name', sql: "ALTER TABLE settings ADD COLUMN president_name VARCHAR(255) AFTER logoUrl" },
            { col: 'president_cpf', sql: "ALTER TABLE settings ADD COLUMN president_cpf VARCHAR(20) AFTER president_name" },
            { col: 'management_start', sql: "ALTER TABLE settings ADD COLUMN management_start DATE AFTER president_cpf" },
            { col: 'management_end', sql: "ALTER TABLE settings ADD COLUMN management_end DATE AFTER management_start" },
            { col: 'president_signature', sql: "ALTER TABLE settings ADD COLUMN president_signature LONGTEXT AFTER management_end" }
        ];

        for (const m of settingsMigrations) {
            try {
                const [cols] = await pool.query(`SHOW COLUMNS FROM settings LIKE '${m.col}'`);
                if (cols.length === 0) await pool.query(m.sql);
            } catch (err) {}
        }

        // Migração de colunas faltantes em ai_keys
        const aiKeysMigrations = [
            { col: 'model', sql: "ALTER TABLE ai_keys ADD COLUMN model VARCHAR(100) DEFAULT 'gemini-3-flash-preview' AFTER provider" },
            { col: 'tier', sql: "ALTER TABLE ai_keys ADD COLUMN tier VARCHAR(20) DEFAULT 'FREE' AFTER model" },
            { col: 'error_count', sql: "ALTER TABLE ai_keys ADD COLUMN error_count INT DEFAULT 0 AFTER priority" },
            { col: 'last_checked', sql: "ALTER TABLE ai_keys ADD COLUMN last_checked DATETIME AFTER error_count" }
        ];

        for (const m of aiKeysMigrations) {
            try {
                const [cols] = await pool.query(`SHOW COLUMNS FROM ai_keys LIKE '${m.col}'`);
                if (cols.length === 0) await pool.query(m.sql);
            } catch (err) {}
        }

        console.log("✅ KERNEL SRE: Schema Consolidado V10.0.");
    } catch (e) { console.error("❌ Schema Error:", e.message); }
};

app.use('/api', apiRoutes);
setInterval(() => { processScheduledMessages(); }, 60000);
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const boot = async () => {
    try {
        await ensureSchema();
        app.listen(PORT, () => console.log(`🚀 S.I.E PRO ACTIVE ON PORT ${PORT}`));
    } catch (error) { process.exit(1); }
};
boot();