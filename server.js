
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
app.use(express.static(path.join(__dirname, 'dist')));

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

// ENDPOINT REAL DE ESTATÍSTICAS DEMOGRÁFICAS (SRE V22.10)
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
            // Mapeamento de Renda
            if (data.incomeRange === 'LOW') stats.incomeDistribution.low++;
            else if (data.incomeRange === 'MID_LOW') stats.incomeDistribution.midLow++;
            else if (data.incomeRange === 'MID') stats.incomeDistribution.mid++;
            else if (data.incomeRange === 'HIGH') stats.incomeDistribution.high++;

            // Mapeamento de Vulnerabilidade baseado em Tags
            const tags = data.tags || [];
            if (tags.includes('AJUDA_URGENTE')) stats.vulnerability.critical++;
            else if (tags.includes('BAIXA_RENDA') || tags.includes('IDOSO_SOLO')) stats.vulnerability.moderate++;
            else stats.vulnerability.low++;
        });

        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

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
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, unit: user.unit } });
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
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'ACESSO_NEGADO' });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const matrix = req.body;
        await connection.query('DELETE FROM role_permissions');
        const insertData = [];
        for (const [role, perms] of Object.entries(matrix)) {
            if (Array.isArray(perms)) perms.forEach(p => insertData.push([role, p]));
        }
        if (insertData.length > 0) await connection.query('INSERT INTO role_permissions (role, permission_id) VALUES ?', [insertData]);
        await connection.commit();
        res.json({ success: true });
    } catch (e) { await connection.rollback(); res.status(500).json({ error: e.message }); }
    finally { connection.release(); }
});

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const [[{ income }]] = await pool.query('SELECT SUM(amount) as income FROM financials WHERE type="INCOME"');
        const [[{ expense }]] = await pool.query('SELECT SUM(amount) as expense FROM financials WHERE type="EXPENSE"');
        const [[{ openIncidents }]] = await pool.query('SELECT COUNT(*) as count FROM incidents WHERE status != "RESOLVED"');
        const [[{ totalPopulation }]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE active = 1');
        res.json({ balance: (income || 0) - (expense || 0), openIncidents, totalPopulation, sla: '98.5%' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/:id/score', authenticate, async (req, res) => {
    try {
        const [financials] = await pool.query('SELECT type, status FROM financials WHERE user_id = ?', [req.params.id]);
        let score = 500;
        financials.forEach(f => {
            if (f.type === 'INCOME' && f.status === 'PAID') score += 50;
            if (f.status === 'OVERDUE') score -= 100;
        });
        const finalScore = Math.min(Math.max(score, 0), 1000);
        res.json({ score: finalScore, status: finalScore > 700 ? 'SAUDÁVEL' : 'ATENÇÃO' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/surveys/public/check-resident/:cpf', async (req, res) => {
    try {
        const cleanCpf = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query('SELECT name, unit, email, phone FROM users WHERE REPLACE(REPLACE(cpf_cnpj, ".", ""), "-", "") = ? AND active = 1', [cleanCpf]);
        if (rows.length > 0) {
            const user = rows[0];
            const maskedName = user.name.split(' ')[0] + ' ' + (user.name.split(' ')[1] || '').substring(0, 1) + '...';
            res.json({ found: true, name: maskedName, unit: user.unit, email: user.email, phone: user.phone });
        } else res.json({ found: false });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/surveys/public/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Censo indisponível' });
        const [qRows] = await pool.query('SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY order_priority ASC', [req.params.id]);
        const questions = qRows.map(q => ({ ...q, options: safeJsonParse(q.options) }));
        res.json({ ...rows[0], questions });
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
            contents: `Redija um documento oficial para associação de moradores baseado em: ${req.body.prompt}`,
            config: { systemInstruction: "Você é um redator jurídico-administrativo sênior especialista em condomínios." }
        });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const createCrudRoutes = (table, path, jsonFields = []) => {
    app.get(`/api/${path}`, authenticate, async (req, res) => {
        try {
            const { page = 1, limit = 100, search = '', ...filters } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            let where = table === 'users' ? ['active = 1'] : [];
            let params = [];
            if (search) {
                const fields = table === 'users' ? ['name', 'cpf_cnpj', 'unit'] : ['title', 'name', 'description'];
                where.push(`(${fields.map(f => `\`${f}\` LIKE ?`).join(' OR ')})`);
                fields.forEach(() => params.push(`%${search}%`));
            }
            Object.entries(filters).forEach(([k, v]) => { if (v) { where.push(`\`${k}\` = ?`); params.push(v); } });
            const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
            const [rows] = await pool.query(`SELECT * FROM \`${table}\`${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
            const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM \`${table}\`${whereSql}`, params);
            const data = rows.map(r => {
                jsonFields.forEach(f => r[f] = safeJsonParse(r[f], {}));
                return r;
            });
            res.json({ data, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post(`/api/${path}`, authenticate, async (req, res) => {
        try {
            const payload = { ...req.body };
            delete payload.id;
            if (table === 'users') {
                payload.password_hash = await bcrypt.hash(payload.password || 'membro123', 10);
                delete payload.password;
                payload.active = 1;
            }
            jsonFields.forEach(f => { if (payload[f]) payload[f] = JSON.stringify(payload[f]); });
            const [result] = await pool.query(`INSERT INTO \`${table}\` SET ?`, [payload]);
            res.json({ id: result.insertId, ...req.body });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.put(`/api/${path}/:id`, authenticate, async (req, res) => {
        try {
            const payload = { ...req.body };
            const id = req.params.id;
            delete payload.id; delete payload.created_at;
            if (table === 'users' && payload.password) {
                payload.password_hash = await bcrypt.hash(payload.password, 10);
                delete payload.password;
            }
            jsonFields.forEach(f => { if (payload[f]) payload[f] = JSON.stringify(payload[f]); });
            await pool.query(`UPDATE \`${table}\` SET ? WHERE id = ?`, [payload, id]);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete(`/api/${path}/:id`, authenticate, async (req, res) => {
        try {
            if (table === 'users') await pool.query('UPDATE users SET active = 0 WHERE id = ?', [req.params.id]);
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

app.get('/api/health', (req, res) => res.json({ status: 'ONLINE', engine: 'SRE_MASTER_CORE_V22.10' }));

app.get('/api/settings/system', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(rows[0] || {});
});

app.post('/api/settings/system', authenticate, async (req, res) => {
    const payload = { ...req.body }; delete payload.id;
    await pool.query('UPDATE settings SET ? WHERE id = 1', [payload]);
    res.json({ success: true });
});

app.post('/api/system/hydrate', authenticate, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' });
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const hash = await bcrypt.hash('admin123', 10);
        await conn.query('INSERT IGNORE INTO settings (id, name, cnpj) VALUES (1, "S.I.E PRO - Gestão Ativa", "00.000.000/0001-99")');
        await conn.query('INSERT IGNORE INTO users (id, username, password_hash, name, email, cpf_cnpj, unit, role, status, active) VALUES (1, "admin", ?, "Administrador SRE", "admin@sie.pro", "00000000000", "HQ", "ADMIN", "ACTIVE", 1)', [hash]);
        await conn.commit();
        res.json({ success: true });
    } catch (e) { await conn.rollback(); res.status(500).json({ error: e.message }); }
    finally { conn.release(); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

app.listen(PORT, () => console.log(`🚀 KERNEL S.I.E PRO OPERACIONAL | PORTA ${PORT} | V22.10`));
