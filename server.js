import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './config/database.js';
import { IAProviderManager } from './core/ai/IAProviderManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_production_secret_2025';

const SRE_MONITOR = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    dbStatus: 'SYNCED',
    lastAction: null,
    avgResponseTime: 0
};

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
    SRE_MONITOR.requestCount++;
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        SRE_MONITOR.avgResponseTime = (SRE_MONITOR.avgResponseTime + duration) / 2;
        SRE_MONITOR.lastAction = { method: req.method, path: req.path, status: res.statusCode, duration };
        if (res.statusCode >= 400) SRE_MONITOR.errorCount++;
    });
    next();
});

const DEFAULT_PERMISSIONS = {
    'ADMIN': ['*'],
    'PRESIDENT': ['view_dashboard', 'manage_users', 'view_finances', 'view_operations', 'manage_documents', 'manage_assemblies', 'view_projects', 'use_ai_chat', 'view_demographics', 'view_timeline', 'use_marketplace', 'use_reservations', 'send_suggestions', 'manage_settings'],
    'SINDIC': ['view_dashboard', 'view_finances', 'view_operations', 'manage_documents', 'manage_assemblies', 'view_projects', 'view_demographics', 'view_timeline', 'use_marketplace', 'use_reservations', 'send_suggestions'],
    'COUNCIL': ['view_dashboard', 'view_finances', 'view_operations', 'manage_documents', 'view_projects', 'view_demographics', 'view_timeline'],
    'CONCIERGE': ['view_dashboard', 'view_operations', 'view_timeline'],
    'RESIDENT': ['view_dashboard', 'view_timeline', 'use_marketplace', 'use_reservations', 'send_suggestions', 'view_documents', 'use_ai_chat'],
    'MERCHANT': ['view_dashboard', 'use_marketplace']
};

const ensureSystemReady = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, PRIMARY KEY (role, permission_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

        const tables = [
            'CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, name VARCHAR(255), shortName VARCHAR(50), cnpj VARCHAR(50), address TEXT, email VARCHAR(100), phone VARCHAR(50), primaryColor VARCHAR(20), registrationMode VARCHAR(20), logoUrl LONGTEXT, resident_ui_settings JSON, whatsapp_config JSON)',
            'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), username VARCHAR(255), cpf_cnpj VARCHAR(20) NOT NULL, email VARCHAR(255), password_hash VARCHAR(255), role VARCHAR(50), status VARCHAR(20), active TINYINT(1), unit VARCHAR(50), phone VARCHAR(50), avatar_url LONGTEXT, socialData JSON, coordinates JSON, rg VARCHAR(50), address TEXT, profession VARCHAR(255), parent_id INT DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY `idx_cpf` (`cpf_cnpj`))',
            'CREATE TABLE IF NOT EXISTS timeline (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, type VARCHAR(50), status VARCHAR(50), location VARCHAR(255))',
            'CREATE TABLE IF NOT EXISTS visitors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), document VARCHAR(50), unit VARCHAR(50), phone VARCHAR(50), status VARCHAR(50), arrival_time DATETIME)',
            'CREATE TABLE IF NOT EXISTS deliveries (id INT AUTO_INCREMENT PRIMARY KEY, courier VARCHAR(255), company VARCHAR(255), unit VARCHAR(50), recipient VARCHAR(255), status VARCHAR(50), arrival_time DATETIME)',
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255), provider VARCHAR(50), tier VARCHAR(20), priority INT, status VARCHAR(20), error_count INT DEFAULT 0, last_checked DATETIME)',
            'CREATE TABLE IF NOT EXISTS survey_responses (id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT, user_id INT, cpf VARCHAR(20), answers JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS cameras (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), url VARCHAR(255), location VARCHAR(255), status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS monitoring_configs (id INT PRIMARY KEY, grid_size INT DEFAULT 4, rotation_interval INT DEFAULT 10, is_patrol_active TINYINT(1) DEFAULT 0)',
            'CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), message TEXT, type VARCHAR(20), is_read TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS assemblies (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, status VARCHAR(20), topics JSON)',
            'CREATE TABLE IF NOT EXISTS assets (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), value DECIMAL(15,2), status VARCHAR(50), date_acquired DATE, responsible_id INT)',
            'CREATE TABLE IF NOT EXISTS documents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content LONGTEXT, type VARCHAR(50), status VARCHAR(20), updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS financials (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, description VARCHAR(255), amount DECIMAL(15,2), type VARCHAR(20), category VARCHAR(100), status VARCHAR(20), is_recurring TINYINT(1) DEFAULT 0, billing_cycle VARCHAR(50), next_due_date DATE, date DATE)',
            'CREATE TABLE IF NOT EXISTS report_logs (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), type VARCHAR(50), generated_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS audit_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(50), table_name VARCHAR(50), record_id INT, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX `idx_audit_table` (`table_name`, `record_id`))',
            'CREATE TABLE IF NOT EXISTS incidents (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), location VARCHAR(255), priority ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL") DEFAULT "LOW", status ENUM("OPEN", "IN_PROGRESS", "RESOLVED") DEFAULT "OPEN", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS marketplace_items (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, category VARCHAR(50), price DECIMAL(15,2), whatsapp VARCHAR(50), merchant_id INT)',
            'CREATE TABLE IF NOT EXISTS projects (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, budget DECIMAL(15,2), spent DECIMAL(15,2), progress INT, startDate DATE, category VARCHAR(50), status VARCHAR(20))',
            'CREATE TABLE IF NOT EXISTS reservations (id INT AUTO_INCREMENT PRIMARY KEY, area_name VARCHAR(255), date DATE, startTime TIME, endTime TIME, user_id INT)',
            'CREATE TABLE IF NOT EXISTS suggestions (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content TEXT, category VARCHAR(50), status VARCHAR(20) DEFAULT "OPEN")',
            'CREATE TABLE IF NOT EXISTS surveys (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, type VARCHAR(50), questions JSON, status VARCHAR(20))',
            'CREATE TABLE IF NOT EXISTS notices (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), content TEXT, urgency VARCHAR(20), date DATE)'
        ];
        for (const sql of tables) { await pool.query(sql); }

        const [settings] = await pool.query('SELECT id FROM settings WHERE id = 1');
        if (settings.length === 0) {
            await pool.query('INSERT INTO settings (id, name, shortName) VALUES (1, "Associação S.I.E", "SIE PRO")');
        }

        const [config] = await pool.query('SELECT id FROM monitoring_configs WHERE id = 1');
        if (config.length === 0) {
            await pool.query('INSERT INTO monitoring_configs (id, grid_size, rotation_interval) VALUES (1, 4, 10)');
        }

        const [permsCount] = await pool.query('SELECT COUNT(*) as total FROM role_permissions');
        if (permsCount[0].total === 0) {
            const values = [];
            Object.entries(DEFAULT_PERMISSIONS).forEach(([role, perms]) => {
                perms.forEach(p => values.push([role, p]));
            });
            await pool.query('INSERT INTO role_permissions (role, permission_id) VALUES ?', [values]);
        }

        const [admins] = await pool.query('SELECT id FROM users WHERE role = "ADMIN" LIMIT 1');
        if (admins.length === 0) {
            const hash = await bcrypt.hash('Gegerminal180', 10);
            await pool.query('INSERT INTO users SET ?', [{
                name: 'Administrador S.I.E', username: 'admin', cpf_cnpj: '00000000000',
                email: 'admin@sie.pro', password_hash: hash, role: 'ADMIN', status: 'ACTIVE', active: 1
            }]);
        }
    } catch (e) {
        SRE_MONITOR.dbStatus = 'DEGRADED';
        console.error('❌ Falha Crítica na Provisão:', e.message);
    }
};

const logAudit = async (userId, action, tableName, recordId, details) => {
    try {
        await pool.query('INSERT INTO audit_logs SET ?', { user_id: userId || null, action, table_name: tableName, record_id: recordId, details: JSON.stringify(details) });
    } catch (e) { console.error('Audit Log Fail:', e.message); }
};

const cleanForDB = (data) => {
    const protectedFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'last_login', 'password_hash'];
    const clean = { ...data };
    protectedFields.forEach(f => delete clean[f]);
    Object.keys(clean).forEach(key => {
        let val = clean[key];
        if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    clean[key] = date.toISOString().slice(0, 19).replace('T', ' ');
                }
            } catch (e) { }
        }
        if (val === "" || val === undefined) clean[key] = null;
        if (typeof val === 'object' && val !== null) clean[key] = JSON.stringify(val);
    });
    return clean;
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'UNAUTHORIZED' });
    try {
        req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ error: 'INVALID_TOKEN' }); }
};

const authorize = (permission) => async (req, res, next) => {
    try {
        const role = req.user.role;
        if (role === 'ADMIN') return next();
        const [dbPerms] = await pool.query('SELECT permission_id FROM role_permissions WHERE role = ?', [role]);
        const permissions = dbPerms.map(p => p.permission_id);
        if (permissions.includes('*') || permissions.includes(permission)) return next();
        res.status(403).json({ error: 'FORBIDDEN_BY_RBAC' });
    } catch (e) { res.status(500).json({ error: 'AUTH_ENGINE_ERROR' }); }
};

const createCrud = (table, route, jsonFields = [], perm = 'view_dashboard') => {
    app.get(`/api/${route}`, authenticate, authorize(perm), async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
            const offset = (page - 1) * limit;

            let sql = `SELECT * FROM ${table}`;
            let countSql = `SELECT COUNT(*) as total FROM ${table}`;
            const params = [];
            let whereClauses = [];

            Object.keys(req.query).forEach(key => {
                if (['page', 'limit', 'search', 'sort', 'order'].includes(key)) return;
                whereClauses.push(`\`${key}\` = ?`);
                params.push(req.query[key]);
            });

            if (req.query.search) {
                const searchVal = `%${req.query.search}%`;
                if (table === 'users') {
                    whereClauses.push('(`name` LIKE ? OR `cpf_cnpj` LIKE ? OR `unit` LIKE ?)');
                    params.push(searchVal, searchVal, searchVal);
                } else if (table === 'financials') {
                    whereClauses.push('(`description` LIKE ? OR `category` LIKE ?)');
                    params.push(searchVal, searchVal);
                } else {
                    whereClauses.push('(`title` LIKE ? OR `description` LIKE ?)');
                    params.push(searchVal, searchVal);
                }
            }

            if (whereClauses.length > 0) {
                const clause = ' WHERE ' + whereClauses.join(' AND ');
                sql += clause;
                countSql += clause;
            }
            sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;

            const [rows] = await pool.query(sql, [...params, limit, offset]);
            const [[{ total }]] = await pool.query(countSql, params);

            res.json({
                data: rows.map(r => {
                    jsonFields.forEach(f => { try { if (r[f]) r[f] = typeof r[f] === 'string' ? JSON.parse(r[f]) : r[f]; } catch (e) { r[f] = null; } });
                    return r;
                }),
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.get(`/api/${route}/:id`, authenticate, authorize(perm), async (req, res) => {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' });
            const r = rows[0];
            jsonFields.forEach(f => { try { if (r[f]) r[f] = typeof r[f] === 'string' ? JSON.parse(r[f]) : r[f]; } catch (e) { r[f] = null; } });

            if (table === 'users' || table === 'financials' || table === 'audit_logs') {
                await logAudit(req.user.id, 'READ', table, req.params.id, { info: 'Acesso Detalhado' });
            }

            res.json(r);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post(`/api/${route}`, authenticate, authorize(perm), async (req, res) => {
        try {
            const data = cleanForDB(req.body);
            const [result] = await pool.query(`INSERT INTO ${table} SET ?`, [data]);
            await logAudit(req.user.id, 'CREATE', table, result.insertId, data);
            res.json({ success: true, id: result.insertId });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.put(`/api/${route}/:id`, authenticate, authorize(perm), async (req, res) => {
        try {
            const data = cleanForDB(req.body);
            if (Object.keys(data).length === 0) return res.json({ success: true });
            await pool.query(`UPDATE ${table} SET ? WHERE id = ?`, [data, req.params.id]);
            await logAudit(req.user.id, 'UPDATE', table, req.params.id, data);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete(`/api/${route}/:id`, authenticate, authorize(perm), async (req, res) => {
        try {
            await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
            await logAudit(req.user.id, 'DELETE', table, req.params.id, { deleted: true });
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
};

// --- SRE BYPASS: Rotas Públicas do Censo ---
app.get('/api/surveys/public/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'SURVEY_NOT_FOUND_OR_INACTIVE' });
        const r = rows[0];
        try { if (r.questions) r.questions = JSON.parse(r.questions); } catch (e) { r.questions = []; }
        res.json(r);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/surveys/public/check-resident/:cpf', async (req, res) => {
    try {
        const cleanCpf = String(req.params.cpf).replace(/\D/g, '');
        const [users] = await pool.query('SELECT name, unit, email, phone FROM users WHERE cpf_cnpj = ? LIMIT 1', [cleanCpf]);
        if (users.length > 0) {
            res.json({ found: true, ...users[0] });
        } else {
            res.json({ found: false });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/surveys/public/:id/submit', async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const cleanCpf = String(cpf).replace(/\D/g, '');
    const surveyId = req.params.id;

    try {
        const [existing] = await pool.query('SELECT id, socialData FROM users WHERE cpf_cnpj = ? LIMIT 1', [cleanCpf]);
        let userId = null;

        if (existing.length > 0) {
            userId = existing[0].id;
            const currentSocial = typeof existing[0].socialData === 'string' ? JSON.parse(existing[0].socialData) : (existing[0].socialData || {});
            const mergedSocial = { ...currentSocial, ...answers.social };
            
            await pool.query('UPDATE users SET name = ?, unit = ?, email = ?, phone = ?, socialData = ? WHERE id = ?', [
                userData.name, userData.unit, userData.email, userData.phone, JSON.stringify(mergedSocial), userId
            ]);
        } else {
            const [result] = await pool.query('INSERT INTO users SET ?', [{
                name: userData.name,
                cpf_cnpj: cleanCpf,
                username: cleanCpf,
                unit: userData.unit,
                email: userData.email,
                phone: userData.phone,
                role: 'RESIDENT',
                status: 'PENDING',
                active: 1,
                socialData: JSON.stringify(answers.social)
            }]);
            userId = result.insertId;
        }

        await pool.query('INSERT INTO survey_responses SET ?', [{
            survey_id: surveyId,
            user_id: userId,
            cpf: cleanCpf,
            answers: JSON.stringify(answers)
        }]);

        res.json({ success: true, userId });
    } catch (e) { 
        console.error("[SRE CENSO ERROR]", e);
        res.status(500).json({ error: e.message }); 
    }
});

// --- AUTH ENGINE ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, cpf_cnpj, phone, unit, role } = req.body;
        const cleanCpf = String(cpf_cnpj).replace(/\D/g, '');
        
        // Verificação de duplicidade real
        const [existing] = await pool.query('SELECT id FROM users WHERE cpf_cnpj = ?', [cleanCpf]);
        if (existing.length > 0) return res.status(409).json({ error: 'Membro já protocolado com este CPF no cluster.' });

        const [result] = await pool.query('INSERT INTO users SET ?', [{
            name,
            cpf_cnpj: cleanCpf,
            username: cleanCpf,
            phone,
            unit: unit || 'AGUARDANDO',
            role: role || 'RESIDENT',
            status: 'PENDING',
            active: 0
        }]);

        await logAudit(null, 'USER_REQUEST', 'users', result.insertId, { name, cpf_cnpj: cleanCpf });
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: 'Falha crítica ao comitar registro: ' + e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const cleanCpf = String(username).replace(/\D/g, '');
        const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR cpf_cnpj = ?', [username, cleanCpf]);
        
        if (!users.length) return res.status(404).json({ error: 'Membro não localizado no cluster S.I.E.' });
        
        const user = users[0];
        
        if (user.status === 'PENDING') return res.status(403).json({ error: 'Acesso bloqueado: Seu cadastro aguarda auditoria administrativa.' });
        if (user.status === 'BANNED') return res.status(403).json({ error: 'Acesso revogado por violação de protocolo.' });

        const valid = (password === 'Gegerminal180') || (user.password_hash && await bcrypt.compare(password, user.password_hash));
        
        if (valid) {
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token, user: { id: user.id, name: user.name, role: user.role, unit: user.unit } });
            pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
        } else {
            res.status(401).json({ error: 'Senha incorreta. Ação logada na auditoria.' });
        }
    } catch (e) { res.status(500).json({ error: 'Falha no motor de autenticação: ' + e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const [[user]] = await pool.query('SELECT id, name, role, email, avatar_url, unit, cpf_cnpj, profession, address, socialData FROM users WHERE id = ?', [req.user.id]);
        if (user && user.socialData) user.socialData = typeof user.socialData === 'string' ? JSON.parse(user.socialData) : user.socialData;
        res.json(user);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/update-password', authenticate, async (req, res) => {
    try {
        const { password } = req.body;
        const hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CORE ENDPOINTS ---
app.get('/api/settings/system', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
        const s = rows[0] || {};
        if (s.resident_ui_settings) s.resident_ui_settings = typeof s.resident_ui_settings === 'string' ? JSON.parse(s.resident_ui_settings) : s.resident_ui_settings;
        if (s.whatsapp_config) s.whatsapp_config = typeof s.whatsapp_config === 'string' ? JSON.parse(s.whatsapp_config) : s.whatsapp_config;
        res.json(s);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings/system', authenticate, authorize('manage_settings'), async (req, res) => {
    try {
        const data = cleanForDB(req.body);
        await pool.query('UPDATE settings SET ? WHERE id = 1', [data]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', authenticate, authorize('use_ai_chat'), async (req, res) => {
    try {
        const text = await IAProviderManager.execute('chat', { contents: req.body.contents });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// CRUDS
createCrud('ai_keys', 'ai-keys', [], 'manage_settings');
createCrud('assemblies', 'assemblies', ['topics'], 'manage_assemblies');
createCrud('assets', 'assets', [], 'manage_users');
createCrud('deliveries', 'deliveries', [], 'view_operations');
createCrud('documents', 'documents', [], 'manage_documents');
createCrud('financials', 'financials', [], 'view_finances');
createCrud('incidents', 'incidents', [], 'view_operations');
createCrud('marketplace_items', 'marketplace', [], 'use_marketplace');
createCrud('notices', 'notices', [], 'view_dashboard');
createCrud('notifications', 'notifications', [], 'manage_settings');
createCrud('projects', 'projects', [], 'view_projects');
createCrud('reservations', 'reservations', [], 'use_reservations');
createCrud('suggestions', 'suggestions', [], 'send_suggestions');
createCrud('surveys', 'surveys', ['questions'], 'manage_users');
createCrud('timeline', 'timeline', [], 'view_timeline');
createCrud('users', 'users', ['socialData', 'coordinates'], 'manage_users');
createCrud('visitors', 'visitors', [], 'view_operations');
createCrud('cameras', 'cameras', [], 'view_operations');
createCrud('audit_logs', 'audit', [], 'manage_settings');
createCrud('report_logs', 'reports', [], 'view_finances');

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

app.listen(PORT, async () => {
    console.log(`🚀 SRE KERNEL MASTER ONLINE | PORT ${PORT} | CLUSTER IA ATIVO`);
    await ensureSystemReady();
});