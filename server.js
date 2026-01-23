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

// Middlewares de Segurança e Payload
app.use(cors());
app.use(express.json({ limit: '100mb' }));

/**
 * ENGINE DE AUTO-REPARO SRE (SCHEMA AUTO-HEALING V240.8 - AUDITED)
 */
const ensureSchema = async () => {
    try {
        console.log("🔍 [SRE KERNEL] Iniciando auditoria de esquema V240.8...");
        
        const sqls = [
            'CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), address TEXT, email VARCHAR(100), phone VARCHAR(50), website VARCHAR(255), primaryColor VARCHAR(20), registrationMode VARCHAR(20), logoUrl LONGTEXT, resident_ui_settings JSON, whatsapp_config JSON, module_metadata JSON, president_name VARCHAR(255), president_cpf VARCHAR(20), management_start DATE, management_end DATE, president_signature LONGTEXT, coordinates JSON DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS roles (id VARCHAR(50) PRIMARY KEY, label VARCHAR(100) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            
            // TABELA USERS (MASTER IDENTITY V240.8)
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
                unit VARCHAR(50), 
                age INT, 
                birth_date DATE, 
                rg VARCHAR(50),
                issuing_authority VARCHAR(100),
                gender VARCHAR(20), 
                nationality VARCHAR(50) DEFAULT "Brasileira", 
                phone VARCHAR(50), 
                whatsapp VARCHAR(50), 
                preferred_channel VARCHAR(20) DEFAULT "WHATSAPP", 
                avatar_url LONGTEXT, 
                document_front_url LONGTEXT, 
                document_back_url LONGTEXT, 
                ocr_payload JSON, 
                socialData JSON, 
                coordinates JSON, 
                address TEXT, 
                profession VARCHAR(255), 
                voting_rights TINYINT(1) DEFAULT 1, 
                resident_type VARCHAR(50) DEFAULT "TITULAR", 
                created_by INT, 
                last_login DATETIME, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
            
            // TABELAS OPERACIONAIS
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, location VARCHAR(255), priority VARCHAR(100) DEFAULT "LOW", status VARCHAR(20) DEFAULT "OPEN", description TEXT, radius INT DEFAULT 0, coordinates JSON, reporter_name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS visitors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, document VARCHAR(50), unit VARCHAR(50) NOT NULL, phone VARCHAR(50), status VARCHAR(20) DEFAULT "IN_CLUSTER", arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS deliveries (id INT AUTO_INCREMENT PRIMARY KEY, courier VARCHAR(255), company VARCHAR(255), unit VARCHAR(50) NOT NULL, recipient VARCHAR(255), status VARCHAR(20) DEFAULT "PENDING", arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            
            // IA & MENSAGERIA
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255) NOT NULL, provider VARCHAR(50) DEFAULT "GOOGLE", model VARCHAR(100) DEFAULT "gemini-3-flash-preview", tier VARCHAR(20) DEFAULT "FREE", status VARCHAR(20) DEFAULT "ACTIVE", priority INT DEFAULT 1, error_count INT DEFAULT 0, last_checked DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS message_templates (id INT AUTO_INCREMENT PRIMARY KEY, event_trigger VARCHAR(50) UNIQUE, name VARCHAR(100), content TEXT, is_active TINYINT(1) DEFAULT 1, variables_available JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
            'CREATE TABLE IF NOT EXISTS scheduled_broadcasts (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, target_type VARCHAR(20), target_value VARCHAR(100), message_body TEXT, template_id INT, scheduled_at DATETIME, status VARCHAR(20) DEFAULT "PENDING", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        ];
        
        for (const sql of sqls) { await pool.query(sql); }

        // MIGRATION DE REFORÇO V240.8
        const criticalMigrations = [
            { table: 'settings', col: 'whatsapp_config', def: 'JSON DEFAULT NULL' },
            { table: 'settings', col: 'module_metadata', def: 'JSON DEFAULT NULL' },
            { table: 'ai_keys', col: 'model', def: 'VARCHAR(100) DEFAULT "gemini-3-flash-preview"' },
            { table: 'ai_keys', col: 'tier', def: 'VARCHAR(20) DEFAULT "FREE"' },
            { table: 'users', col: 'address', def: 'TEXT DEFAULT NULL' },
            { table: 'users', col: 'profession', def: 'VARCHAR(255) DEFAULT NULL' }
        ];

        for (const m of criticalMigrations) {
            try {
                await pool.query(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.def}`);
            } catch (err) {
                if (err.errno !== 1060) console.error(`[SRE ERROR] ${m.table}.${m.col}:`, err.message);
            }
        }

        const [existing] = await pool.query("SELECT id FROM settings WHERE id = 1");
        if (existing.length === 0) {
            await pool.query("INSERT INTO settings (id, name, shortName, primaryColor, registrationMode) VALUES (1, 'Associação Residencial S.I.E PRO', 'S.I.E PRO', '#4f46e5', 'APPROVAL')");
        }

        console.log("✅ [SRE KERNEL] Cluster consolidado e operando em V240.8 (AUDITED).");
    } catch (e) { 
        console.error("❌ [SCHEMA PANIC] Falha crítica na integridade do banco:", e.message); 
        process.exit(1);
    }
};

// --- ROTAS DE API ---
app.use('/api', apiRoutes);

// --- PROCESSADOR DE MENSAGENS AGENDADAS ---
setInterval(() => { processScheduledMessages(); }, 60000);

// --- SERVIDOR ESTÁTICO & SPA REROUTING ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => res.status(503).send("Kernel em manutenção: Aguardando Build do Frontend..."));
}

const boot = async () => {
    try {
        await ensureSchema();
        app.listen(PORT, () => {
            console.log(`🚀 [S.I.E PRO CORE] Sistema Operacional na porta ${PORT}`);
        });
    } catch (error) { 
        console.error("❌ [BOOT FAIL]", error.message);
        process.exit(1); 
    }
};

boot();