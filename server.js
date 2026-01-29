
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

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
            console.warn(`[SRE ALERT] ${req.method} ${req.originalUrl} - STATUS: ${res.statusCode} - ${duration}ms`);
        } else {
            console.log(`[SRE ACCESS] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
        }
    });
    next();
});

const ensureSchema = async () => {
    try {
        console.log("🔍 [SRE KERNEL] Auditando integridade do cluster S.I.E PRO...");
        
        const tables = [
            `CREATE TABLE IF NOT EXISTS settings (
                id INT PRIMARY KEY, 
                name VARCHAR(255), 
                shortName VARCHAR(50), 
                cnpj VARCHAR(50), 
                address TEXT, 
                email VARCHAR(100), 
                phone VARCHAR(50), 
                website VARCHAR(255), 
                primaryColor VARCHAR(20) DEFAULT "#4f46e5", 
                registrationMode VARCHAR(20) DEFAULT "APPROVAL", 
                logoUrl LONGTEXT, 
                resident_ui_settings JSON, 
                whatsapp_config JSON, 
                module_metadata JSON, 
                president_name VARCHAR(255), 
                president_cpf VARCHAR(20), 
                management_start DATE, 
                management_end DATE, 
                president_signature LONGTEXT, 
                coordinates JSON DEFAULT NULL, 
                context_rules TEXT,
                cep VARCHAR(10),
                street VARCHAR(255),
                number VARCHAR(50),
                complement VARCHAR(255),
                neighborhood VARCHAR(255),
                city VARCHAR(255),
                state VARCHAR(2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY, 
                name VARCHAR(255) NOT NULL, 
                username VARCHAR(255), 
                cpf_cnpj VARCHAR(20) NOT NULL UNIQUE, 
                email VARCHAR(255), 
                password_hash VARCHAR(255), 
                role VARCHAR(50) DEFAULT "RESIDENT", 
                status VARCHAR(20) DEFAULT "PENDING", 
                active TINYINT(1) DEFAULT 1, 
                unit VARCHAR(100), 
                age INT, 
                birth_date DATE, 
                rg VARCHAR(50), 
                issuing_authority VARCHAR(100), 
                gender VARCHAR(50), 
                phone VARCHAR(50), 
                whatsapp VARCHAR(50), 
                preferred_channel VARCHAR(20) DEFAULT "WHATSAPP", 
                avatar_url LONGTEXT, 
                socialData JSON, 
                coordinates JSON, 
                address TEXT, 
                profession VARCHAR(100), 
                voting_rights TINYINT(1) DEFAULT 1, 
                resident_type VARCHAR(50) DEFAULT "TITULAR", 
                parent_id INT DEFAULT NULL, 
                cep VARCHAR(10),
                street VARCHAR(255),
                number VARCHAR(50),
                complement VARCHAR(255),
                neighborhood VARCHAR(255),
                city VARCHAR(255),
                state VARCHAR(2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

            'CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255), amount DECIMAL(15,2), type VARCHAR(20), category VARCHAR(100), status VARCHAR(20), is_recurring TINYINT(1) DEFAULT 0, billing_cycle VARCHAR(50), date DATE, next_due_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, type VARCHAR(50), status VARCHAR(20) DEFAULT "DRAFT", updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS assemblies (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, status VARCHAR(20) DEFAULT "SCHEDULED", topics JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), location VARCHAR(255), priority VARCHAR(100), status VARCHAR(20) DEFAULT "OPEN", description TEXT, radius INT DEFAULT 0, coordinates JSON, reporter_name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255) NOT NULL, provider VARCHAR(50) DEFAULT "GOOGLE", model VARCHAR(100) DEFAULT "gemini-3-flash-preview", tier VARCHAR(20) DEFAULT "FREE", status VARCHAR(20) DEFAULT "ACTIVE", priority INT DEFAULT 1, error_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            
            `CREATE TABLE IF NOT EXISTS message_templates (
                id INT AUTO_INCREMENT PRIMARY KEY, 
                event_trigger VARCHAR(100), 
                name VARCHAR(100), 
                content TEXT, 
                variables_available JSON, 
                is_active TINYINT(1) DEFAULT 1, 
                attach_logo TINYINT(1) DEFAULT 0,
                media_url LONGTEXT DEFAULT NULL,
                media_type VARCHAR(20) DEFAULT 'image',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            `CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
                id INT AUTO_INCREMENT PRIMARY KEY, 
                user_id INT, 
                target_type VARCHAR(50), 
                target_value VARCHAR(255), 
                message_body TEXT, 
                template_id INT, 
                scheduled_at DATETIME, 
                status VARCHAR(20) DEFAULT "PENDING", 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            'CREATE TABLE IF NOT EXISTS notices (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content TEXT, urgency VARCHAR(20), date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, merchant_id INT, title VARCHAR(255), description TEXT, price DECIMAL(15,2), category VARCHAR(50), whatsapp VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS reservations (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, area_name VARCHAR(100), date DATE, startTime TIME, endTime TIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4',
            'CREATE TABLE IF NOT EXISTS suggestions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, title VARCHAR(255), content TEXT, category VARCHAR(50), status VARCHAR(20) DEFAULT "OPEN", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
        ];
        
        for (const sql of tables) { await pool.query(sql); }

        // SRE SYNC: Garantir campos de mídia e upgrade de tipo para upload em instalações existentes
        try { await pool.query(`ALTER TABLE message_templates MODIFY COLUMN media_url LONGTEXT DEFAULT NULL`); } catch(e){}
        try { await pool.query(`ALTER TABLE message_templates ADD COLUMN media_type VARCHAR(20) DEFAULT 'image'`); } catch(e){}

        console.log("✅ [SRE KERNEL] Ecossistema de Tabelas Sincronizado V2.8.0.");
    } catch (e) { 
        console.error("❌ [SCHEMA PANIC]", e.message); 
        process.exit(1);
    }
};

app.use('/api', apiRoutes);
setInterval(() => { processScheduledMessages(); }, 60000);

const boot = async () => {
    await ensureSchema();
    app.listen(PORT, () => {
        console.log(`🚀 [S.I.E PRO CORE] Sistema Ativo na porta ${PORT}`);
    });
};
boot();
