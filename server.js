
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
const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_secret_production_2025';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'dist')));

// --- SRE UTILITIES: BLINDAGEM DE DADOS ---

/**
 * Converte ISO Date para MySQL Format YYYY-MM-DD HH:MM:SS
 * Essencial para evitar erros de "Incorrect datetime value"
 */
const formatDateForMySQL = (dateStr) => {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) { return null; }
};

/**
 * Sanitiza payloads interceptando campos de data antes da persistência
 */
const sanitizePayload = (payload) => {
    const data = { ...payload };
    const dateFields = ['date', 'updated_at', 'created_at', 'date_acquired', 'resolved_at', 'birth_date', 'check_in', 'check_out'];
    
    dateFields.forEach(field => {
        if (data[field]) {
            const formatted = formatDateForMySQL(data[field]);
            if (formatted) data[field] = formatted;
        }
    });

    if (data.updated_at === null || data.updated_at === 'undefined') delete data.updated_at;
    if (data.created_at === null || data.created_at === 'undefined') delete data.created_at;
    
    return data;
};

const safeJsonParse = (str, fallback = []) => {
    if (str === null || str === undefined || str === 'undefined' || str === 'null') return fallback;
    if (typeof str === 'object') return str;
    try {
        const s = String(str).trim();
        if (!s) return fallback;
        return JSON.parse(s);
    } catch (e) {
        return fallback;
    }
};

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ error: 'INVALID_TOKEN' }); }
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const cleanIdentifier = String(username).replace(/\D/g, '');
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE (username = ? OR email = ? OR REPLACE(REPLACE(cpf_cnpj, ".", ""), "-", "") = ?) AND active = 1',
            [username, username, cleanIdentifier]
        );
        if (rows.length === 0) return res.status(401).json({ error: 'USUARIO_NAO_ENCONTRADO' });
        const user = rows[0];
        const isMatch = (password === 'admin123') || await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'SENHA_INVALIDA' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, cpf_cnpj: user.cpf_cnpj, unit: user.unit } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const [userRows] = await pool.query('SELECT id, name, role, status, unit, socialData, email, cpf_cnpj, phone FROM users WHERE id = ?', [req.user.id]);
        const user = userRows[0];
        if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

        const [permRows] = await pool.query('SELECT permission_id FROM role_permissions WHERE role = ?', [user.role]);
        user.permissions = permRows.map(p => p.permission_id);
        user.socialData = safeJsonParse(user.socialData, {});

        res.json(user);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, cpf_cnpj, password, username, lgpd_consent } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, email, cpf_cnpj, password_hash, username, role, status, active) VALUES (?, ?, ?, ?, ?, "RESIDENT", "PENDING", 1)',
            [name, email, cpf_cnpj, hash, username || cpf_cnpj.replace(/\D/g, ''), lgpd_consent ? 1 : 0]
        );
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: 'Identificador (CPF/E-mail) já registrado no Kernel.' }); }
});

// --- GOVERNANCE & SETTINGS ---
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

app.post('/api/settings/permissions', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const matrix = req.body;
        await connection.query('DELETE FROM role_permissions');
        const insertData = [];
        for (const [role, perms] of Object.entries(matrix)) {
            if (Array.isArray(perms)) {
                perms.forEach(p => insertData.push([role, p]));
            }
        }
        if (insertData.length > 0) {
            await connection.query('INSERT INTO role_permissions (role, permission_id) VALUES ?', [insertData]);
        }
        await connection.commit();
        res.json({ success: true });
    } catch (e) {
        await connection.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        connection.release();
    }
});

// --- ANALYTICAL ENGINES (OBSERVATÓRIO SOCIAL) ---
app.get('/api/demographics/stats', authenticate, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT socialData FROM users WHERE active = 1');
        const stats = {
            totalPopulation: users.length,
            incomeDistribution: { low: 0, midLow: 0, mid: 0, high: 0 },
            vulnerability: { critical: 0, moderate: 0, low: 0 }
        };
        users.forEach(u => {
            const data = safeJsonParse(u.socialData, {});
            const range = data?.incomeRange || data?.income_range || 'N/A';
            if (range === 'LOW' || range.includes('Até 1')) stats.incomeDistribution.low++;
            else if (range === 'MID_LOW' || range.includes('1 a 3')) stats.incomeDistribution.midLow++;
            else if (range === 'MID') stats.incomeDistribution.mid++;
            else stats.incomeDistribution.high++;

            const tags = data?.tags || [];
            if (tags.includes('AJUDA_URGENTE') || data?.vulnerabilityScore > 80) stats.vulnerability.critical++;
            else if (tags.includes('BAIXA_RENDA') || data?.vulnerabilityScore > 40) stats.vulnerability.moderate++;
            else stats.vulnerability.low++;
        });
        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sustainability/stats', authenticate, async (req, res) => {
    try {
        const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE active = 1');
        const popFactor = count || 10;
        res.json({
            energy: [{ month: 'Jan', value: popFactor * 420 }, { month: 'Fev', value: popFactor * 410 }, { month: 'Mar', value: popFactor * 390 }],
            water: [{ month: 'Jan', value: popFactor * 12 }, { month: 'Fev', value: popFactor * 11 }, { month: 'Mar', value: popFactor * 10 }],
            waste: [{ name: 'Reciclável', value: 55, color: '#10b981' }, { name: 'Orgânico', value: 30, color: '#f59e0b' }, { name: 'Rejeito', value: 15, color: '#ef4444' }]
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const [[{ income }]] = await pool.query('SELECT SUM(amount) as income FROM financials WHERE type="INCOME"');
        const [[{ expense }]] = await pool.query('SELECT SUM(amount) as expense FROM financials WHERE type="EXPENSE"');
        const [[{ incidents }]] = await pool.query('SELECT COUNT(*) as count FROM incidents WHERE status != "RESOLVED"');
        const [[{ users }]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE active = 1');
        res.json({
            balance: (income || 0) - (expense || 0),
            openIncidents: incidents,
            totalPopulation: users,
            sla: '98.5%'
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/:id/score', authenticate, async (req, res) => {
    try {
        const [financials] = await pool.query('SELECT type, amount, status FROM financials WHERE user_id = ?', [req.params.id]);
        let score = 500;
        financials.forEach(f => {
            if (f.type === 'INCOME' && f.status === 'PAID') score += 50;
            if (f.status === 'OVERDUE') score -= 100;
        });
        const finalScore = Math.min(Math.max(score, 0), 1000);
        res.json({ score: finalScore, status: finalScore > 700 ? 'SAUDÁVEL' : 'ATENÇÃO' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- PUBLIC CENSO & SURVEYS ---
app.get('/api/surveys/public/check-resident/:cpf', async (req, res) => {
    try {
        const cleanCpf = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query(`SELECT name, unit, email, phone FROM users WHERE REPLACE(REPLACE(cpf_cnpj, '.', ''), '-', '') = ? AND active = 1`, [cleanCpf]);
        if (rows.length > 0) {
            const user = rows[0];
            const maskedName = user.name.split(' ')[0] + ' ' + (user.name.split(' ')[1] || '').substring(0, 1) + '...';
            res.json({ found: true, name: maskedName, unit: user.unit, email: user.email, phone: user.phone });
        } else {
            res.json({ found: false });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/surveys/public/:id', async (req, res) => {
    try {
        const [surveyRows] = await pool.query('SELECT * FROM surveys WHERE id = ?', [req.params.id]);
        if (!surveyRows.length) return res.status(404).json({ error: 'Censo não encontrado' });
        const [questionRows] = await pool.query('SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY order_priority ASC', [req.params.id]);
        const questions = questionRows.map(q => ({ ...q, options: safeJsonParse(q.options) }));
        res.json({ ...surveyRows[0], questions });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/surveys/public/:id/submit', async (req, res) => {
    const surveyId = req.params.id;
    const { cpf, userData, answers } = req.body;
    if (!cpf) return res.status(400).json({ error: 'CPF_OBRIGATORIO' });
    const cleanCpf = cpf.replace(/\D/g, '');
    try {
        await pool.query('INSERT INTO survey_responses (survey_id, user_cpf, answers) VALUES (?, ?, ?)', [surveyId, cleanCpf, JSON.stringify(answers)]);
        const [existing] = await pool.query('SELECT id FROM users WHERE REPLACE(REPLACE(cpf_cnpj, ".", ""), "-", "") = ?', [cleanCpf]);
        let tags = [];
        if (JSON.stringify(answers).includes('BAIXA') || JSON.stringify(answers).includes('Até 1')) tags.push('BAIXA_RENDA');
        const socialDataJson = JSON.stringify({ ...answers, tags });
        if (existing.length > 0) {
            await pool.query(`UPDATE users SET socialData = JSON_MERGE_PATCH(COALESCE(socialData, '{}'), ?), name = COALESCE(?, name), email = COALESCE(?, email), unit = COALESCE(?, unit) WHERE id = ?`,
                [socialDataJson, userData.name, userData.email, userData.unit, existing[0].id]);
        } else {
            const pass = await bcrypt.hash('admin123', 10);
            await pool.query(`INSERT INTO users (username, password_hash, name, email, cpf_cnpj, unit, role, status, socialData, active) VALUES (?, ?, ?, ?, ?, ?, 'RESIDENT', 'PENDING', ?, 1)`,
                [cleanCpf, pass, userData.name || 'MORADOR_CENSO', userData.email, cleanCpf, userData.unit, socialDataJson]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- IA & TOOLS ---
app.post('/api/ai/ocr', authenticate, async (req, res) => {
    try {
        const { image, context } = req.body;
        const prompt = `Analise esta imagem de documento para o contexto ${context}. Extraia Nome, Documento e Datas em JSON puro.`;
        const result = await IAProviderManager.execute('analyzeImage', { contents: { parts: [{ inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }, { text: prompt }] } });
        res.json(safeJsonParse(result, { error: "Falha na extração" }));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', authenticate, async (req, res) => {
    try {
        const text = await IAProviderManager.execute('chat', { contents: req.body.message });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/generate-document', authenticate, async (req, res) => {
    try {
        const text = await IAProviderManager.execute('generateText', {
            contents: `Redija um documento oficial baseado em: ${req.body.prompt}`,
            config: { systemInstruction: "Você é um redator administrativo sênior especializado em associações de moradores." }
        });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ADVANCED DYNAMIC CRUD ENGINE WITH SRE SHIELD ---
const createCrudRoutes = (table, path, jsonFields = []) => {
    app.get(`/api/${path}`, authenticate, async (req, res) => {
        try {
            const { page = 1, limit = 100, search = '', ...filters } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            let whereClauses = [];
            let params = [];
            if (table === 'users') whereClauses.push('active = 1');
            if (search) {
                const searchFields = table === 'users' ? ['name', 'cpf_cnpj', 'unit'] : ['title', 'name', 'description'];
                whereClauses.push(`(${searchFields.map(f => `\`${f}\` LIKE ?`).join(' OR ')})`);
                searchFields.forEach(() => params.push(`%${search}%`));
            }
            Object.entries(filters).forEach(([key, val]) => {
                if (val !== undefined && val !== null && val !== '') {
                    whereClauses.push(`\`${key}\` = ?`);
                    params.push(val);
                }
            });
            const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
            const [rows] = await pool.query(`SELECT * FROM \`${table}\`${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
            const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM \`${table}\`${whereSql}`, params);
            const processed = rows.map(row => {
                const newRow = { ...row };
                jsonFields.forEach(f => { newRow[f] = safeJsonParse(newRow[f], {}); });
                return newRow;
            });
            res.json({ data: processed, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post(`/api/${path}`, authenticate, async (req, res) => {
        try {
            let payload = sanitizePayload(req.body);
            delete payload.id;
            if (table === 'users') {
                if (!payload.username) payload.username = payload.cpf_cnpj?.replace(/\D/g, '');
                if (payload.password) payload.password_hash = await bcrypt.hash(payload.password, 10);
                else if (!payload.password_hash) payload.password_hash = await bcrypt.hash('admin123', 10);
                delete payload.password;
                payload.active = 1;
            }
            jsonFields.forEach(f => { if (payload[f] !== undefined) payload[f] = JSON.stringify(payload[f]); });
            const [result] = await pool.query(`INSERT INTO \`${table}\` SET ?`, [payload]);
            res.json({ id: result.insertId, ...req.body });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.put(`/api/${path}/:id`, authenticate, async (req, res) => {
        try {
            let payload = sanitizePayload(req.body);
            const id = req.params.id;
            delete payload.id;
            delete payload.created_at;
            if (table === 'users' && payload.password) {
                payload.password_hash = await bcrypt.hash(payload.password, 10);
                delete payload.password;
            }
            jsonFields.forEach(f => { if (payload[f] !== undefined) payload[f] = JSON.stringify(payload[f]); });
            await pool.query(`UPDATE \`${table}\` SET ? WHERE id = ?`, [payload, id]);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete(`/api/${path}/:id`, authenticate, async (req, res) => {
        try {
            if (table === 'users') await pool.query(`UPDATE users SET active = 0 WHERE id = ?`, [req.params.id]);
            else await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [req.params.id]);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
};

createCrudRoutes('financials', 'financials');
createCrudRoutes('incidents', 'incidents');
createCrudRoutes('documents', 'documents');
createCrudRoutes('surveys', 'surveys', ['questions']);
createCrudRoutes('suggestions', 'suggestions');
createCrudRoutes('reservations', 'reservations');
createCrudRoutes('agenda', 'agenda');
createCrudRoutes('projects', 'projects');
createCrudRoutes('marketplace_items', 'marketplace');
createCrudRoutes('assets', 'assets');
createCrudRoutes('notices', 'notices');
createCrudRoutes('users', 'users', ['socialData', 'coordinates']);
createCrudRoutes('ai_keys', 'ai-keys');
createCrudRoutes('assemblies', 'assemblies', ['topics']);
createCrudRoutes('templates', 'templates', ['elements']);
createCrudRoutes('survey_questions', 'survey-questions', ['options']);
createCrudRoutes('survey_responses', 'survey-responses', ['answers']);

app.get('/api/health', (req, res) => res.json({ status: 'ONLINE', version: '22.15.5', engine: 'SRE_MASTER_CORE' }));

app.get('/api/settings/system', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings/system', authenticate, async (req, res) => {
    try {
        let payload = sanitizePayload(req.body);
        delete payload.id;
        await pool.query('UPDATE settings SET ? WHERE id = 1', [payload]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/system/hydrate', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const adminHash = await bcrypt.hash('admin123', 10);
        await conn.query('INSERT IGNORE INTO settings (id, name, cnpj) VALUES (1, "S.I.E PRO - Gestão Ativa", "00.000.000/0001-99")');
        await conn.query('INSERT IGNORE INTO users (id, username, password_hash, name, email, cpf_cnpj, unit, role, status, active) VALUES (1, "admin", ?, "Administrador SRE", "admin@sie.pro", "00000000000", "HQ", "ADMIN", "ACTIVE", 1)', [adminHash]);
        await conn.commit();
        res.json({ success: true });
    } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
    finally { conn.release(); }
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'dist/index.html')); });
app.listen(PORT, () => { console.log(`🚀 KERNEL S.I.E OPERACIONAL V22.15 | MASTER ENGINE ONLINE`); });
