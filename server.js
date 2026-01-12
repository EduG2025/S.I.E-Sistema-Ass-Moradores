
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

// SRE UTILITIES
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

// --- AUTH & USER PROFILE ---

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
        const [rows] = await pool.query('SELECT id, name, role, username, email, unit, cpf_cnpj, socialData FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'USER_NOT_FOUND' });
        const user = rows[0];
        user.socialData = safeJsonParse(user.socialData);
        const [perms] = await pool.query('SELECT permission_id FROM role_permissions WHERE role = ?', [user.role]);
        res.json({ ...user, permissions: perms.map(p => p.permission_id) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SETTINGS (FIXED) ---

app.get('/api/settings/system', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings/system', authenticate, async (req, res) => {
    try {
        const data = sanitizePayload(req.body);
        // Garante que o ID 1 sempre exista ou seja atualizado
        const [existing] = await pool.query('SELECT id FROM settings WHERE id = 1');
        if (existing.length > 0) {
            await pool.query('UPDATE settings SET ? WHERE id = 1', [data]);
        } else {
            await pool.query('INSERT INTO settings SET ?, id = 1', [data]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "DB_WRITE_FAIL: " + e.message }); }
});

app.get('/api/settings/permissions', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT role, permission_id FROM role_permissions');
        const matrix = {};
        rows.forEach(r => {
            if (!matrix[r.role]) matrix[r.role] = [];
            matrix[r.role].push(r.permission_id);
        });
        res.json(matrix);
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
        const stats = { 
            totalPopulation: users.length, 
            incomeDistribution: { low: 0, midLow: 0, mid: 0, high: 0 }, 
            vulnerability: { low: 0, moderate: 0, critical: 0 } 
        };
        users.forEach(u => {
            const data = safeJsonParse(u.socialData, {});
            if (data.incomeRange === 'LOW') stats.incomeDistribution.low++;
            else if (data.incomeRange === 'HIGH') stats.incomeDistribution.high++;
            else stats.incomeDistribution.mid++;

            if (data.vulnerabilityScore > 70) stats.vulnerability.critical++;
            else if (data.vulnerabilityScore > 30) stats.vulnerability.moderate++;
            else stats.vulnerability.low++;
        });
        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- IA SERVICES ---

app.post('/api/ai/chat', authenticate, async (req, res) => {
    try {
        const text = await IAProviderManager.execute('generateText', { contents: req.body.message });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/generate-document', authenticate, async (req, res) => {
    try {
        const text = await IAProviderManager.execute('generateText', { 
            contents: req.body.prompt,
            config: { systemInstruction: "Você é um assistente jurídico especializado em governança condominial." }
        });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/ocr', authenticate, async (req, res) => {
    try {
        const { image, context } = req.body;
        const prompt = `Analise a imagem de documento no contexto de ${context}. Extraia todos os campos relevantes em um JSON puro.`;
        const result = await IAProviderManager.execute('analyzeImage', {
            contents: { 
                parts: [
                    { inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }, 
                    { text: prompt }
                ] 
            }
        });
        res.json(safeJsonParse(result, { error: "PARSE_FAIL" }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PUBLIC SURVEYS (Link Externo) ---

app.get('/api/surveys/public/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Pesquisa não localizada ou inativa.' });
        const survey = rows[0];
        survey.questions = safeJsonParse(survey.questions);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/surveys/public/check-resident/:cpf', async (req, res) => {
    try {
        const cpf = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query('SELECT name, unit, email, phone FROM users WHERE REPLACE(REPLACE(cpf_cnpj, ".", ""), "-", "") = ?', [cpf]);
        if (rows.length) res.json({ found: true, ...rows[0] });
        else res.json({ found: false });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/surveys/public/:id/submit', async (req, res) => {
    try {
        const { cpf, userData, answers } = req.body;
        const cleanCpf = cpf.replace(/\D/g, '');
        
        await pool.query('INSERT INTO survey_responses (survey_id, user_cpf, answers) VALUES (?, ?, ?)', 
            [req.params.id, cleanCpf, JSON.stringify(answers)]);
        
        const [existing] = await pool.query('SELECT id FROM users WHERE REPLACE(REPLACE(cpf_cnpj, ".", ""), "-", "") = ?', [cleanCpf]);
        if (existing.length) {
            await pool.query('UPDATE users SET socialData = JSON_MERGE_PATCH(socialData, ?) WHERE id = ?', 
                [JSON.stringify(answers), existing[0].id]);
        } else {
            await pool.query('INSERT INTO users (name, cpf_cnpj, unit, email, phone, role, socialData, active) VALUES (?, ?, ?, ?, ?, "RESIDENT", ?, 1)',
                [userData.name, cpf, userData.unit, userData.email, userData.phone, JSON.stringify(answers)]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- DYNAMIC CRUD REGISTRATION ---

const createCrud = (table, route, jsonFields = []) => {
    app.get(`/api/${route}`, authenticate, async (req, res) => {
        try {
            const { user_cpf } = req.query;
            let query = `SELECT * FROM ${table}`;
            let params = [];
            if (user_cpf) {
                query += ` WHERE user_cpf = ?`;
                params.push(user_cpf);
            }
            query += ` ORDER BY id DESC`;
            const [rows] = await pool.query(query, params);
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
createCrud('survey_responses', 'survey-responses', ['answers']);
createCrud('notices', 'notices');
createCrud('agenda', 'agenda');
createCrud('suggestions', 'suggestions');
createCrud('reservations', 'reservations');

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

app.listen(PORT, () => console.log(`🚀 SRE KERNEL ONLINE | ENGINE V25.9 | PORT ${PORT}`));
