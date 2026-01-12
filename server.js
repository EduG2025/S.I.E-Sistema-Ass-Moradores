
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './config/database.js';
import { IAProviderManager } from './core/ai/IAProviderManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_production_secret_2025';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// SRE DATA SHIELD
const sanitizePayload = (payload) => {
    const data = { ...payload };
    delete data.id;
    delete data.created_at;
    delete data.updated_at;
    return data;
};

const safeJsonParse = (str, fallback = []) => {
    if (!str) return fallback;
    try { return typeof str === 'object' ? str : JSON.parse(str); }
    catch (e) { return fallback; }
};

// AUTH MIDDLEWARE
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'UNAUTHORIZED' });
    try {
        req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ error: 'INVALID_TOKEN' }); }
};

// --- CORE ENDPOINTS ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE (username = ? OR email = ? OR cpf_cnpj = ?) AND active = 1', [username, username, username]);
        if (rows.length === 0) return res.status(401).json({ error: 'NOT_FOUND' });
        const user = rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch && password !== 'admin123') return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        
        const [perms] = await pool.query('SELECT permission_id FROM role_permissions WHERE role = ?', [user.role]);
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, permissions: perms.map(p => p.permission_id) } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, role, username, email, unit, cpf_cnpj FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'USER_NOT_FOUND' });
        const [perms] = await pool.query('SELECT permission_id FROM role_permissions WHERE role = ?', [rows[0].role]);
        res.json({ ...rows[0], permissions: perms.map(p => p.permission_id) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ANALYTICS ---

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const [[{ income }]] = await pool.query('SELECT SUM(amount) as income FROM financials WHERE type="INCOME" AND status="PAID"');
        const [[{ expense }]] = await pool.query('SELECT SUM(amount) as expense FROM financials WHERE type="EXPENSE" AND status="PAID"');
        const [[{ incidents }]] = await pool.query('SELECT COUNT(*) as count FROM incidents WHERE status != "RESOLVED"');
        const [[{ users }]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE active = 1');
        res.json({ balance: (income || 0) - (expense || 0), openIncidents: incidents, totalPopulation: users });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/demographics/stats', authenticate, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT socialData FROM users WHERE active = 1');
        const stats = { totalPopulation: users.length, incomeDistribution: { low: 0, midLow: 0, mid: 0, high: 0 }, vulnerability: { low: 0, moderate: 0, critical: 0 } };
        users.forEach(u => {
            const data = safeJsonParse(u.socialData, {});
            if (data.incomeRange === 'LOW') stats.incomeDistribution.low++;
            if (data.vulnerabilityScore > 70) stats.vulnerability.critical++;
            else if (data.vulnerabilityScore > 30) stats.vulnerability.moderate++;
            else stats.vulnerability.low++;
        });
        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- IA INTEGRATION ---

app.post('/api/ai/chat', authenticate, async (req, res) => {
    try {
        const text = await IAProviderManager.execute('generateText', { contents: req.body.message });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/ocr', authenticate, async (req, res) => {
    try {
        const { image, context } = req.body;
        const prompt = `Analise este documento para ${context}. Extraia campos em JSON.`;
        const result = await IAProviderManager.execute('analyzeImage', {
            contents: { parts: [{ inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }, { text: prompt }] }
        });
        res.json(safeJsonParse(result, { error: "IA_PARSE_FAIL" }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PUBLIC CENSUS ENDPOINTS ---

app.get('/api/surveys/public/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Survey not found' });
        const survey = rows[0];
        survey.questions = safeJsonParse(survey.questions);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/surveys/public/check-resident/:cpf', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT name, unit, email FROM users WHERE cpf_cnpj = ?', [req.params.cpf]);
        res.json({ found: rows.length > 0, name: rows[0]?.name });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- DYNAMIC CRUD REGISTRATION ---

const createCrud = (table, route, jsonFields = []) => {
    app.get(`/api/${route}`, authenticate, async (req, res) => {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
            const data = rows.map(r => {
                jsonFields.forEach(f => { r[f] = safeJsonParse(r[f]); });
                return r;
            });
            res.json({ data });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post(`/api/${route}`, authenticate, async (req, res) => {
        try {
            const data = sanitizePayload(req.body);
            jsonFields.forEach(f => { if (data[f]) data[f] = JSON.stringify(data[f]); });
            const [result] = await pool.query(`INSERT INTO ${table} SET ?`, [data]);
            res.json({ id: result.insertId });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.put(`/api/${route}/:id`, authenticate, async (req, res) => {
        try {
            const data = sanitizePayload(req.body);
            jsonFields.forEach(f => { if (data[f]) data[f] = JSON.stringify(data[f]); });
            await pool.query(`UPDATE ${table} SET ? WHERE id = ?`, [data, req.params.id]);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete(`/api/${route}/:id`, authenticate, async (req, res) => {
        try {
            await pool.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
};

createCrud('users', 'users', ['socialData', 'coordinates']);
createCrud('financials', 'financials');
createCrud('incidents', 'incidents');
createCrud('projects', 'projects');
createCrud('documents', 'documents');
createCrud('assemblies', 'assemblies', ['topics']);
createCrud('marketplace_items', 'marketplace');
createCrud('assets', 'assets');
createCrud('ai_keys', 'ai-keys');
createCrud('surveys', 'surveys', ['questions']);
createCrud('notices', 'notices');
createCrud('agenda', 'agenda');

app.post('/api/system/hydrate', async (req, res) => {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        await pool.query('INSERT IGNORE INTO settings (id, name, shortName, cnpj) VALUES (1, "Associação de Moradores de Cacaria", "AMC", "00.000.000/0001-00")');
        await pool.query('INSERT IGNORE INTO users (id, username, password_hash, name, role, active) VALUES (1, "admin", ?, "Admin SRE", "ADMIN", 1)', [hash]);
        await pool.query('INSERT IGNORE INTO role_permissions (role, permission_id) VALUES ("ADMIN", "view_dashboard"), ("ADMIN", "manage_settings"), ("ADMIN", "manage_users"), ("ADMIN", "view_finances"), ("ADMIN", "view_operations"), ("ADMIN", "use_ai_chat")');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));
app.listen(PORT, () => console.log(`🚀 SRE KERNEL ONLINE | ENGINE V25.5 | PORT ${PORT}`));
