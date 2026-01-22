import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import apiRoutes from './routes/api.js';
import { processScheduledMessages } from './controllers/communicationController.js';

/**
 * S.I.E MASTER KERNEL - PROTOCOLO SRE V22.5
 * Plataforma de Governança Inteligente Ativa para Associações e Condomínios.
 * Homologação: VPS Linux Ubuntu | Node 20 | MySQL 8.0
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// MIDDLEWARES NUCLEARES
app.use(cors());
app.use(express.json({ limit: '100mb' }));

/**
 * ENGINE DE AUTO-REPARO SRE (SCHEMA AUTO-HEALING)
 * Garante que o banco de dados esteja sempre sincronizado com a versão mais recente do Kernel.
 */
const ensureSchema = async () => {
    try {
        console.log("🔍 [SRE KERNEL] Iniciando auditoria de esquema...");
        
        const sqls = [
            // CONFIGURAÇÕES & CORE
            'CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), address TEXT, email VARCHAR(100), phone VARCHAR(50), website VARCHAR(255), primaryColor VARCHAR(20), registrationMode VARCHAR(20), logoUrl LONGTEXT, resident_ui_settings JSON, whatsapp_config JSON, module_metadata JSON, president_name VARCHAR(255), president_cpf VARCHAR(20), management_start DATE, management_end DATE, president_signature LONGTEXT, coordinates JSON DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100) NOT NULL)',
            'CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id))',
            'CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // IDENTIDADE & SOCIAL
            'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, username VARCHAR(255), cpf_cnpj VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255), password_hash VARCHAR(255), role VARCHAR(50) DEFAULT "RESIDENT", status VARCHAR(20) DEFAULT "PENDING", active TINYINT(1) DEFAULT 1, unit VARCHAR(50), age INT, phone VARCHAR(50), avatar_url LONGTEXT, socialData JSON, coordinates JSON, address TEXT, profession VARCHAR(255), last_login DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS surveys (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, type VARCHAR(50), questions JSON, status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS survey_responses (id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT, user_id INT, cpf VARCHAR(20), user_name VARCHAR(255), answers JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // FINANCEIRO & PATRIMÔNIO
            'CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255) NOT NULL, amount DECIMAL(15,2) NOT NULL, type ENUM("INCOME", "EXPENSE") NOT NULL, category VARCHAR(100), status ENUM("PAID", "PENDING", "OVERDUE", "CANCELLED") DEFAULT "PENDING", is_recurring TINYINT(1) DEFAULT 0, billing_cycle VARCHAR(50), next_due_date DATE, date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS assets (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), value DECIMAL(15,2), status VARCHAR(50), date_acquired DATE, responsible_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // OPERACIONAL & SEGURANÇA (WATCHDOG)
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, location VARCHAR(255), priority VARCHAR(100) DEFAULT "INFORMATIVO (NÍVEL 1)", status ENUM("OPEN", "IN_PROGRESS", "RESOLVED") DEFAULT "OPEN", description TEXT, radius INT DEFAULT 0, coordinates JSON DEFAULT NULL, reporter_name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS cameras (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), url VARCHAR(255), location VARCHAR(255), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS visitors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), document VARCHAR(50), unit VARCHAR(50), phone VARCHAR(50), status VARCHAR(20), arrival_time DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS deliveries (id INT AUTO_INCREMENT PRIMARY KEY, courier VARCHAR(255), company VARCHAR(255), unit VARCHAR(50), recipient VARCHAR(255), status VARCHAR(20), arrival_time DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // GOVERNANÇA & COMUNIDADE
            'CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, type VARCHAR(50), status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS assemblies (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, status VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, merchant_id INT, title VARCHAR(255) NOT NULL, price DECIMAL(15,2) DEFAULT 0, category VARCHAR(50), whatsapp VARCHAR(20), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS reservations (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, area_name VARCHAR(255), date DATE, startTime TIME, endTime TIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS suggestions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255), content TEXT, category VARCHAR(50), status VARCHAR(20) DEFAULT "OPEN", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS agenda (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, date DATETIME, type VARCHAR(50), status VARCHAR(20), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            
            // IA & MENSAGERIA
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255) NOT NULL, provider VARCHAR(50) DEFAULT "GOOGLE", model VARCHAR(100) DEFAULT "gemini-3-flash-preview", tier VARCHAR(20) DEFAULT "FREE", status VARCHAR(20) DEFAULT "ACTIVE", priority INT DEFAULT 1, error_count INT DEFAULT 0, last_checked DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS message_templates (id INT AUTO_INCREMENT PRIMARY KEY, event_trigger VARCHAR(50) UNIQUE, name VARCHAR(100), content TEXT, is_active TINYINT(1) DEFAULT 1, variables_available JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, target_type VARCHAR(20), target_value VARCHAR(100), message_body TEXT, template_id INT, scheduled_at DATETIME, status VARCHAR(20) DEFAULT "PENDING", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
        ];
        
        for (const sql of sqls) { await pool.query(sql); }

        // MIGRATION ENGINE ADITIVA: Injeção de colunas críticas para compatibilidade V22+
        const criticalMigrations = [
            { table: 'settings', col: 'coordinates', def: 'JSON DEFAULT NULL' },
            { table: 'settings', col: 'module_metadata', def: 'JSON DEFAULT NULL' },
            { table: 'settings', col: 'president_name', def: 'VARCHAR(255) DEFAULT NULL' },
            { table: 'settings', col: 'president_cpf', def: 'VARCHAR(20) DEFAULT NULL' },
            { table: 'users', col: 'coordinates', def: 'JSON DEFAULT NULL' },
            { table: 'users', col: 'socialData', def: 'JSON DEFAULT NULL' },
            { table: 'incidents', col: 'coordinates', def: 'JSON DEFAULT NULL' },
            { table: 'incidents', col: 'radius', def: 'INT DEFAULT 0' }
        ];

        for (const m of criticalMigrations) {
            try {
                await pool.query(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.def}`);
            } catch (err) {
                // Código 1060 = Duplicate Column (Ignorado para garantir idempotência)
                if (err.errno !== 1060) console.error(`[SRE ERROR] ${m.table}.${m.col}:`, err.message);
            }
        }

        // HIDRATAÇÃO INICIAL (SINGLETON SETTINGS)
        const [existing] = await pool.query("SELECT id FROM settings WHERE id = 1");
        if (existing.length === 0) {
            await pool.query("INSERT INTO settings (id, name, shortName, primaryColor, registrationMode) VALUES (1, 'Associação Residencial S.I.E PRO', 'S.I.E PRO', '#4f46e5', 'APPROVAL')");
        }

        console.log("✅ [SRE KERNEL] Cluster consolidado e operando em V22.5.");
    } catch (e) { 
        console.error("❌ [SCHEMA PANIC] Falha crítica na integridade do banco:", e.message); 
        process.exit(1);
    }
};

// ORQUESTRADOR DE ROTAS
app.use('/api', apiRoutes);

// SERVIÇOS DE BACKGROUND (BROADCAST HEARTBEAT)
setInterval(() => { processScheduledMessages(); }, 60000);

// ENTREGA DE FRONTEND (SPA HANDLER)
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// BOOTSTRAP PROTOCOL
const boot = async () => {
    try {
        await ensureSchema();
        app.listen(PORT, () => {
            console.log(`🚀 [S.I.E PRO CORE] Sistema Operacional na porta ${PORT}`);
            console.log(`🔗 Interface Local: http://localhost:${PORT}`);
        });
    } catch (error) { 
        console.error("🛑 [BOOT FAILURE] O Kernel não conseguiu iniciar:", error.message);
        process.exit(1); 
    }
};

boot();