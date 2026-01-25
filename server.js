
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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
 * ENGINE DE AUTO-REPARO SRE (SCHEMA MASTER V241.0 - FULL PROVISIONING)
 * Garante a criação de todo o ecossistema S.I.E no boot.
 */
const ensureSchema = async () => {
    try {
        console.log("🔍 [SRE KERNEL] Auditando integridade do cluster S.I.E PRO...");
        
        const tables = [
            'CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), address TEXT, email VARCHAR(100), phone VARCHAR(50), website VARCHAR(255), primaryColor VARCHAR(20) DEFAULT "#4f46e5", registrationMode VARCHAR(20) DEFAULT "APPROVAL", logoUrl LONGTEXT, resident_ui_settings JSON, whatsapp_config JSON, module_metadata JSON, president_name VARCHAR(255), president_cpf VARCHAR(20), management_start DATE, management_end DATE, president_signature LONGTEXT, coordinates JSON DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, username VARCHAR(255), cpf_cnpj VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255), password_hash VARCHAR(255), role VARCHAR(50) DEFAULT "RESIDENT", status VARCHAR(20) DEFAULT "PENDING", active TINYINT(1) DEFAULT 1, unit VARCHAR(50), age INT, birth_date DATE, rg VARCHAR(50), issuing_authority VARCHAR(100), gender VARCHAR(20), phone VARCHAR(50), whatsapp VARCHAR(50), preferred_channel VARCHAR(20) DEFAULT "WHATSAPP", avatar_url LONGTEXT, socialData JSON, coordinates JSON, address TEXT, profession VARCHAR(255), voting_rights TINYINT(1) DEFAULT 1, resident_type VARCHAR(50) DEFAULT "TITULAR", parent_id INT DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255), amount DECIMAL(15,2), type VARCHAR(20), category VARCHAR(100), status VARCHAR(20), is_recurring TINYINT(1) DEFAULT 0, billing_cycle VARCHAR(50), date DATE, next_due_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, type VARCHAR(50), status VARCHAR(20) DEFAULT "DRAFT", updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS assemblies (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, status VARCHAR(20) DEFAULT "SCHEDULED", topics JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), location VARCHAR(255), priority VARCHAR(100), status VARCHAR(20) DEFAULT "OPEN", description TEXT, radius INT DEFAULT 0, coordinates JSON, reporter_name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, merchant_id INT, title VARCHAR(255), description TEXT, category VARCHAR(50), price DECIMAL(15,2), whatsapp VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS reservations (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, area_name VARCHAR(100), date DATE, startTime TIME, endTime TIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS notices (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content TEXT, urgency VARCHAR(20), date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS suggestions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255), content TEXT, category VARCHAR(50), status VARCHAR(20) DEFAULT "OPEN", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS agenda (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, type VARCHAR(50), status VARCHAR(50), location VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS assets (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), value DECIMAL(15,2), status VARCHAR(50), date_acquired DATE, responsible_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS cameras (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), url VARCHAR(255), location VARCHAR(255), status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS surveys (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, type VARCHAR(50), questions JSON, status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS survey_responses (id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT, user_id INT, cpf VARCHAR(20), user_name VARCHAR(255), answers JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS message_templates (id INT AUTO_INCREMENT PRIMARY KEY, event_trigger VARCHAR(50) UNIQUE, name VARCHAR(100), content TEXT, is_active TINYINT(1) DEFAULT 1, variables_available JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, target_type VARCHAR(20), target_value VARCHAR(100), message_body TEXT, template_id INT, scheduled_at DATETIME, status VARCHAR(20) DEFAULT "PENDING", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255) NOT NULL, provider VARCHAR(50) DEFAULT "GOOGLE", model VARCHAR(100) DEFAULT "gemini-3-flash-preview", tier VARCHAR(20) DEFAULT "FREE", status VARCHAR(20) DEFAULT "ACTIVE", priority INT DEFAULT 1, error_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        ];
        
        for (const sql of tables) { await pool.query(sql); }

        const [[existing]] = await pool.query("SELECT id FROM settings WHERE id = 1");
        if (!existing) {
            await pool.query("INSERT INTO settings (id, name, shortName) VALUES (1, 'S.I.E PRO - SISTEMA INTELIGENTE ATIVO', 'S.I.E PRO')");
        }

        console.log("✅ [SRE KERNEL] Ecossistema de Tabelas Sincronizado V241.0.");
    } catch (e) { 
        console.error("❌ [SCHEMA PANIC]", e.message); 
        process.exit(1);
    }
};

app.use('/api', apiRoutes);
setInterval(() => { processScheduledMessages(); }, 60000);

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

const boot = async () => {
    await ensureSchema();
    app.listen(PORT, () => {
        console.log(`🚀 [S.I.E PRO CORE] Sistema Ativo na porta ${PORT}`);
    });
};
boot();
