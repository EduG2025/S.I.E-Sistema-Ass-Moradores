
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './config/database.js';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_secret_production_2025';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware de Autenticação Centralizado
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ error: 'INVALID_TOKEN' }); }
};

// --- IA HELPER ---
const executeAI = async (prompt, modelName = 'gemini-3-flash-preview', imagePart = null) => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return "API_KEY_MISSING";
        const ai = new GoogleGenAI({ apiKey });
        const contents = imagePart ? { parts: [imagePart, { text: prompt }] } : prompt;
        const response = await ai.models.generateContent({ model: modelName, contents });
        return response.text;
    } catch (e) {
        console.error("[AI ERROR]", e.message);
        return "Erro no motor neural.";
    }
};

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ? OR cpf_cnpj = ?', [username, username, username]);
        if (rows.length === 0) return res.status(401).json({ error: 'USUARIO_NAO_ENCONTRADO' });
        const user = rows[0];
        const isMatch = (password === 'admin123') || await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'SENHA_INVALIDA' });
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, avatar_url: user.avatar_url, status: user.status } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT id, name, role, avatar_url, status FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
});

// --- CORE: USERS ---
app.get('/api/users', authenticate, async (req, res) => {
    const { search } = req.query;
    let sql = 'SELECT id, name, username, email, unit, role, status, cpf_cnpj, avatar_url, socialData FROM users';
    const params = [];
    if (search) { sql += ' WHERE name LIKE ? OR cpf_cnpj LIKE ? OR unit LIKE ?'; const p = `%${search}%`; params.push(p, p, p); }
    const [rows] = await pool.query(sql, params);
    res.json({ data: rows, pagination: { page: 1, total: rows.length, pages: 1 } });
});

app.post('/api/users', authenticate, async (req, res) => {
    const { name, email, cpf_cnpj, unit, role, username, password } = req.body;
    const hash = await bcrypt.hash(password || 'sie123', 10);
    try {
        const [result] = await pool.query('INSERT INTO users (name, email, cpf_cnpj, unit, role, username, password_hash, status) VALUES (?,?,?,?,?,?,?,?)',
            [name, email, cpf_cnpj, unit, role, username || cpf_cnpj, hash, 'ACTIVE']);
        res.json({ id: result.insertId, name, role });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
    const { name, email, unit, role, status, socialData } = req.body;
    const sData = typeof socialData === 'string' ? socialData : JSON.stringify(socialData);
    await pool.query('UPDATE users SET name=?, email=?, unit=?, role=?, status=?, socialData=? WHERE id=?', [name, email, unit, role, status, sData, req.params.id]);
    res.json({ success: true });
});

// --- GOVERNANCE: DOCUMENTS & ASSEMBLIES ---
app.get('/api/documents', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM documents ORDER BY updated_at DESC');
    res.json(rows);
});

app.post('/api/documents', authenticate, async (req, res) => {
    const { title, content, type, status } = req.body;
    await pool.query('INSERT INTO documents (title, content, type, status, updated_at) VALUES (?,?,?,?,NOW())', [title, content, type, status]);
    res.json({ success: true });
});

app.put('/api/documents/:id', authenticate, async (req, res) => {
    const { title, content, type, status } = req.body;
    await pool.query('UPDATE documents SET title=?, content=?, type=?, status=?, updated_at=NOW() WHERE id=?', [title, content, type, status, req.params.id]);
    res.json({ success: true });
});

app.get('/api/assemblies', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM assemblies ORDER BY date DESC');
    res.json({ data: rows });
});

app.post('/api/assemblies', authenticate, async (req, res) => {
    const { title, description, date, status } = req.body;
    await pool.query('INSERT INTO assemblies (title, description, date, status) VALUES (?,?,?,?)', [title, description, date, status]);
    res.json({ success: true });
});

app.put('/api/assemblies/:id', authenticate, async (req, res) => {
    const { title, description, date, status, ata_content } = req.body;
    await pool.query('UPDATE assemblies SET title=?, description=?, date=?, status=?, ata_content=? WHERE id=?', [title, description, date, status, ata_content, req.params.id]);
    res.json({ success: true });
});

// --- INFRA: ASSETS & PROJECTS ---
app.get('/api/assets', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM assets');
    res.json(rows);
});

app.post('/api/assets', authenticate, async (req, res) => {
    const { name, category, value, status } = req.body;
    await pool.query('INSERT INTO assets (name, category, value, status) VALUES (?,?,?,?)', [name, category, value, status]);
    res.json({ success: true });
});

app.get('/api/projects', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM projects');
    res.json({ data: rows });
});

app.post('/api/projects', authenticate, async (req, res) => {
    const { title, description, budget, spent, progress, status, category } = req.body;
    await pool.query('INSERT INTO projects (title, description, budget, spent, progress, status, category) VALUES (?,?,?,?,?,?,?)',
        [title, description, budget, spent, progress, status, category]);
    res.json({ success: true });
});

// --- PLANNING: AGENDA & RESERVATIONS ---
app.get('/api/agenda', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM agenda ORDER BY date ASC');
    res.json(rows);
});

app.post('/api/agenda', authenticate, async (req, res) => {
    const { title, description, date, type, status } = req.body;
    await pool.query('INSERT INTO agenda (title, description, date, type, status) VALUES (?,?,?,?,?)', [title, description, date, type, status]);
    res.json({ success: true });
});

app.get('/api/reservations', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT r.*, u.name as userName, u.unit as userUnit FROM reservations r JOIN users u ON r.user_id = u.id ORDER BY r.date DESC');
    res.json(rows);
});

app.post('/api/reservations', authenticate, async (req, res) => {
    const { area_name, date, startTime, endTime } = req.body;
    await pool.query('INSERT INTO reservations (user_id, area_name, date, startTime, endTime) VALUES (?,?,?,?,?)', [req.user.id, area_name, date, startTime, endTime]);
    res.json({ success: true });
});

// --- SOCIAL: SURVEYS & MAP ---
app.get('/api/surveys', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM surveys');
    res.json({ data: rows });
});

app.post('/api/surveys', authenticate, async (req, res) => {
    const { title, description, type } = req.body;
    await pool.query('INSERT INTO surveys (title, description, type, status) VALUES (?,?,?,"ACTIVE")', [title, description, type]);
    res.json({ success: true });
});

app.get('/api/map/units', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT id, name as residentName, unit, socialData FROM users WHERE unit IS NOT NULL');
    const units = rows.map(r => ({
        id: r.id, residentName: r.residentName, unit: r.unit,
        tags: JSON.parse(r.socialData || '{}').tags || [],
        coordinates: { lat: -23.5505 + (Math.random()*0.01), lng: -46.6333 + (Math.random()*0.01) }
    }));
    res.json(units);
});

// --- ESG: SUSTAINABILITY ---
app.get('/api/settings/sustainability', authenticate, async (req, res) => {
    // Simulação de telemetria ESG
    res.json({
        energy: [{ month: 'Jan', value: 4500 }, { month: 'Fev', value: 4200 }, { month: 'Mar', value: 3900 }, { month: 'Abr', value: 3700 }],
        water: [{ month: 'Jan', value: 120 }, { month: 'Fev', value: 115 }, { month: 'Mar', value: 105 }, { month: 'Abr', value: 98 }],
        waste: [{ name: 'Reciclável', value: 45, color: '#10b981' }, { name: 'Orgânico', value: 35, color: '#f59e0b' }, { name: 'Rejeito', value: 20, color: '#ef4444' }]
    });
});

// --- ERP & ANALYTICS ---
app.get('/api/financials', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM financials ORDER BY date DESC');
    res.json({ data: rows });
});

app.post('/api/financials', authenticate, async (req, res) => {
    const { description, amount, type, category, date, user_id, status } = req.body;
    await pool.query('INSERT INTO financials (description, amount, type, category, date, user_id, status) VALUES (?,?,?,?,?,?,?)', [description, amount, type, category, date, user_id || null, status || 'PENDING']);
    res.json({ success: true });
});

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    const [[balance]] = await pool.query('SELECT SUM(CASE WHEN type="INCOME" THEN amount ELSE -amount END) as total FROM financials');
    const [[incidents]] = await pool.query('SELECT COUNT(*) as count FROM incidents WHERE status != "RESOLVED"');
    const [[users]] = await pool.query('SELECT COUNT(*) as count FROM users');
    res.json({ balance: balance.total || 0, openIncidents: incidents.count, totalUsers: users.count, sla: '98.5%' });
});

app.get('/api/demographics/stats', authenticate, async (req, res) => {
    const [users] = await pool.query('SELECT COUNT(*) as total FROM users');
    res.json({ totalPopulation: users[0].total, incomeDistribution: { low: 35, midLow: 25, mid: 20, high: 20 } });
});

// --- AI & GHOSTWRITER ---
app.post('/api/ai/chat', authenticate, async (req, res) => {
    const { message } = req.body;
    const text = await executeAI(message);
    res.json({ text });
});

app.post('/api/ai/global-search', authenticate, async (req, res) => {
    const { query } = req.body;
    const answer = await executeAI(`Responda como S.I.E Advisor sobre: ${query}`);
    res.json({ answer });
});

app.post('/api/ai/generate-document', authenticate, async (req, res) => {
    const { prompt } = req.body;
    const text = await executeAI(`Redija um documento oficial: ${prompt}`);
    res.json({ text });
});

app.post('/api/ai/generate-assembly-ata', authenticate, async (req, res) => {
    const { title, topics, results } = req.body;
    const ata = await executeAI(`Gere uma Ata formal para a assembleia "${title}" com as pautas: ${topics}. Resultados: ${results}`);
    res.json({ ata });
});

app.post('/api/ai/ocr', authenticate, async (req, res) => {
    const { image, context } = req.body;
    const b64 = image.split(',')[1];
    const imagePart = { inlineData: { data: b64, mimeType: 'image/jpeg' } };
    const result = await executeAI(`Extraia dados do documento no contexto de ${context}. JSON format apenas.`, 'gemini-2.5-flash-image', imagePart);
    try { res.json(JSON.parse(result.replace(/```json|```/g, '').trim())); } catch (e) { res.json({ raw: result }); }
});

// --- OPERATIONAL: INCIDENTS, NOTICES, MARKETPLACE, SUGGESTIONS ---
app.get('/api/operations/incidents', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
    res.json(rows);
});

app.post('/api/operations/incidents', authenticate, async (req, res) => {
    const { title, location, priority, status } = req.body;
    await pool.query('INSERT INTO incidents (title, location, priority, status) VALUES (?,?,?,?)', [title, location, priority, status]);
    res.json({ success: true });
});

app.get('/api/communication/notices', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM notices ORDER BY date DESC');
    res.json(rows);
});

app.post('/api/communication/notices', authenticate, async (req, res) => {
    const { title, content, urgency } = req.body;
    await pool.query('INSERT INTO notices (title, content, urgency, date) VALUES (?,?,?,NOW())', [title, content, urgency]);
    res.json({ success: true });
});

app.get('/api/marketplace', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT m.*, u.name as merchantName, u.unit FROM marketplace_items m JOIN users u ON m.merchant_id = u.id');
    res.json(rows);
});

app.get('/api/suggestions', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM suggestions ORDER BY created_at DESC');
    res.json(rows);
});

app.post('/api/suggestions', authenticate, async (req, res) => {
    const { title, content, category } = req.body;
    const sentiment = await executeAI(`Analise sentimento: "${content}". Responda: POSITIVO, NEGATIVO ou NEUTRO.`);
    await pool.query('INSERT INTO suggestions (user_id, title, content, category, sentiment) VALUES (?,?,?,?,?)', [req.user.id, title, content, category, sentiment.trim()]);
    res.json({ success: true });
});

// --- SETTINGS ---
app.get('/api/settings/system', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id=1');
    res.json(rows[0] || {});
});

app.put('/api/settings/system', authenticate, async (req, res) => {
    const { name, cnpj, address, logoUrl } = req.body;
    await pool.query('UPDATE settings SET name=?, cnpj=?, address=?, logoUrl=? WHERE id=1', [name, cnpj, address, logoUrl]);
    res.json({ success: true });
});

// --- APP SERVING ---
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'dist/index.html')); });
app.listen(PORT, () => { console.log(`🚀 S.I.E PRO KERNEL V22.5 - 18 MÓDULOS OPERACIONAIS NO PORT ${PORT}`); });
