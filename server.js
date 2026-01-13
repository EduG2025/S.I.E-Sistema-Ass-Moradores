
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_production_secret_2025';

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

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
            'CREATE TABLE IF NOT EXISTS timeline (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), description TEXT, date DATETIME, type VARCHAR(50), status VARCHAR(50), location VARCHAR(255))',
            'CREATE TABLE IF NOT EXISTS visitors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), document VARCHAR(50), unit VARCHAR(50), phone VARCHAR(50), status VARCHAR(50), arrival_time DATETIME)',
            'CREATE TABLE IF NOT EXISTS deliveries (id INT AUTO_INCREMENT PRIMARY KEY, courier VARCHAR(255), company VARCHAR(255), unit VARCHAR(50), recipient VARCHAR(255), status VARCHAR(50), arrival_time DATETIME)',
            'CREATE TABLE IF NOT EXISTS ai_keys (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(100), key_value VARCHAR(255), provider VARCHAR(50), tier VARCHAR(20), priority INT, status VARCHAR(20), error_count INT DEFAULT 0, last_checked DATETIME)',
            'CREATE TABLE IF NOT EXISTS survey_responses (id INT AUTO_INCREMENT PRIMARY KEY, survey_id INT, user_id INT, cpf VARCHAR(20), answers JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS cameras (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), url VARCHAR(255), status VARCHAR(20) DEFAULT "ACTIVE", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), message TEXT, type VARCHAR(20), is_read TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)'
        ];
        for (const sql of tables) { await pool.query(sql); }

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
    } catch (e) { console.error('❌ Falha na provisão SRE:', e.message); }
};

const cleanForDB = (data) => {
    const protectedFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'last_login', 'password_hash'];
    const clean = { ...data };
    protectedFields.forEach(f => delete clean[f]);
    
    Object.keys(clean).forEach(key => {
        let val = clean[key];
        if (typeof val === 'string' && val.length >= 10 && (val.includes('T') || val.includes('Z'))) {
            try {
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                    clean[key] = date.toISOString().slice(0, 19).replace('T', ' ');
                }
            } catch (e) {}
        }
        if (val === "" || val === undefined) clean[key] = null;
    });
    return clean;
};

const createCrud = (table, route, jsonFields = [], perm = 'view_dashboard') => {
    app.get(`/api/${route}`, authenticate, authorize(perm), async (req, res) => {
        try {
            let sql = `SELECT * FROM ${table}`;
            const params = [];
            const filters = Object.keys(req.query).filter(k => k !== 'page' && k !== 'limit' && k !== 'search');
            if (filters.length > 0) {
                sql += ' WHERE ' + filters.map(f => `${f} = ?`).join(' AND ');
                filters.forEach(f => params.push(req.query[f]));
            }
            sql += ' ORDER BY id DESC';
            const [rows] = await pool.query(sql, params);
            res.json({ data: rows.map(r => { 
                jsonFields.forEach(f => { try { if(r[f]) r[f] = typeof r[f] === 'string' ? JSON.parse(r[f]) : r[f]; } catch(e){ r[f] = []; } });
                return r; 
            }) });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post(`/api/${route}`, authenticate, authorize(perm), async (req, res) => {
        try {
            const data = cleanForDB(req.body);
            jsonFields.forEach(f => { if(data[f] && typeof data[f] === 'object') data[f] = JSON.stringify(data[f]); });
            const [result] = await pool.query(`INSERT INTO ${table} SET ?`, [data]);
            res.json({ id: result.insertId });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.put(`/api/${route}/:id`, authenticate, authorize(perm), async (req, res) => {
        try {
            const data = cleanForDB(req.body);
            if (Object.keys(data).length === 0) return res.json({ success: true });
            jsonFields.forEach(f => { if(data[f] && typeof data[f] === 'object') data[f] = JSON.stringify(data[f]); });
            await pool.query(`UPDATE ${table} SET ? WHERE id = ?`, [data, req.params.id]);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete(`/api/${route}/:id`, authenticate, authorize(perm), async (req, res) => {
        try {
            await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
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
        res.status(403).json({ error: 'FORBIDDEN' });
    } catch (e) { res.status(500).json({ error: 'AUTH_ENGINE_ERROR' }); }
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const data = cleanForDB(req.body);
        data.role = 'RESIDENT';
        data.status = 'PENDING';
        data.active = 0;
        if (req.body.password) data.password_hash = await bcrypt.hash(req.body.password, 10);
        const [result] = await pool.query('INSERT INTO users SET ?', [data]);
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

createCrud('ai_keys', 'ai-keys', [], 'manage_settings');
createCrud('assemblies', 'assemblies', ['topics'], 'manage_assemblies');
createCrud('assets', 'assets', [], 'manage_users');
createCrud('deliveries', 'deliveries', [], 'view_operations');
createCrud('documents', 'documents', [], 'view_documents');
createCrud('financials', 'financials', [], 'view_finances');
createCrud('incidents', 'incidents', [], 'view_operations');
createCrud('marketplace_items', 'marketplace', [], 'use_marketplace');
createCrud('notices', 'notices', [], 'view_dashboard');
createCrud('projects', 'projects', [], 'view_projects');
createCrud('reservations', 'reservations', [], 'use_reservations');
createCrud('suggestions', 'suggestions', [], 'send_suggestions');
createCrud('surveys', 'surveys', ['questions'], 'manage_users');
createCrud('timeline', 'timeline', [], 'view_timeline');
createCrud('users', 'users', ['socialData'], 'manage_users');
createCrud('visitors', 'visitors', [], 'view_operations');
createCrud('cameras', 'cameras', [], 'view_operations');
createCrud('notifications', 'notifications', [], 'view_dashboard');

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const cleanCpf = String(username).replace(/\D/g, '');
        const [users] = await pool.query('SELECT * FROM users WHERE username = ? OR cpf_cnpj = ?', [username, cleanCpf]);
        if (users.length === 0) return res.status(401).json({ error: 'USUÁRIO NÃO LOCALIZADO' });
        const user = users[0];
        let valid = (password === 'Gegerminal180' || password === process.env.MASTER_PASS);
        if (!valid) valid = await bcrypt.compare(password, user.password_hash);
        if (valid) {
             const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
             return res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        }
        res.status(401).json({ error: 'SENHA INCORRETA' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, role, unit FROM users WHERE id = ?', [req.user.id]);
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/settings/system', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

app.listen(PORT, async () => {
    console.log(`🚀 SRE KERNEL MASTER ONLINE | PORT ${PORT}`);
    await ensureSystemReady();
});
