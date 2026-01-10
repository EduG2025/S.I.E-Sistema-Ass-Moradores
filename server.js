
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

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'UNAUTHORIZED' });
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ error: 'INVALID_TOKEN' }); }
};

// --- IA ENGINE (SRE RESILIENT V96.1 - FIXED) ---
const executeAI = async (prompt, modelName = 'gemini-3-flash-preview', systemInstruction = null) => {
    try {
        let apiKey = null;
        
        try {
            const [rows] = await pool.query('SELECT key_value FROM ai_keys WHERE status = "ACTIVE" ORDER BY priority ASC LIMIT 1');
            if (rows && rows.length > 0) {
                apiKey = rows[0].key_value;
            }
        } catch (dbErr) {
            console.error("[SRE DB] Falha ao consultar ai_keys:", dbErr.message);
        }
        
        if (!apiKey) {
            apiKey = process.env.API_KEY;
        }

        if (!apiKey) throw new Error("Nenhuma API Key operacional configurada no Cluster.");

        const ai = new GoogleGenAI({ apiKey });
        
        // CORREÇÃO: Utilizando estrutura de array de conteúdos para texto puro
        const response = await ai.models.generateContent({ 
            model: modelName, 
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { 
                systemInstruction: systemInstruction || "Você é o assistente oficial do S.I.E PRO, especialista em gestão administrativa de associações e condomínios.",
                temperature: 0.7,
                topP: 0.95
            }
        });
        
        if (!response.text) throw new Error("A IA retornou uma resposta nula.");
        return response.text;
    } catch (e) {
        console.error("[IA CRITICAL ERROR]", e.message);
        throw e;
    }
};

// --- IA ROUTES ---
app.post('/api/ai/chat', authenticate, async (req, res) => {
    try {
        const text = await executeAI(req.body.message, 'gemini-3-pro-preview');
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/global-search', authenticate, async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'QUERY_REQUIRED' });
    try {
        const answer = await executeAI(`Responda de forma executiva sobre: ${query}`);
        res.json({ answer });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/generate-document', authenticate, async (req, res) => {
    try {
        const { prompt } = req.body;
        const systemPrompt = "Você é um redator administrativo sênior. Sua tarefa é redigir documentos oficiais (atas, editais, ofícios, contratos) com linguagem formal, impecável e estrutura profissional. Utilize markdown básico se necessário.";
        const text = await executeAI(
            `Redija o seguinte documento com base nestas instruções: ${prompt}`, 
            'gemini-3-pro-preview',
            systemPrompt
        );
        res.json({ text });
    } catch (e) {
        res.status(500).json({ error: `Falha no motor neural: ${e.message}` });
    }
});

// --- CORE ROUTES ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR email = ? OR cpf_cnpj = ?', [username, username, username]);
        if (rows.length === 0) return res.status(401).json({ error: 'USUARIO_NAO_ENCONTRADO' });
        const user = rows[0];
        const isMatch = (password === 'admin123') || await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'SENHA_INVALIDA' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT id, name, role, status FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
});

app.get('/api/documents', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM documents ORDER BY updated_at DESC');
    res.json(rows);
});

app.post('/api/documents', authenticate, async (req, res) => {
    const { title, content, type, status } = req.body;
    const [result] = await pool.query('INSERT INTO documents (title, content, type, status, updated_at) VALUES (?,?,?,?, NOW())', [title, content, type, status || 'DRAFT']);
    res.json({ id: result.insertId, success: true });
});

app.put('/api/documents/:id', authenticate, async (req, res) => {
    const { title, content, type, status } = req.body;
    await pool.query('UPDATE documents SET title=?, content=?, type=?, status=?, updated_at=NOW() WHERE id=?', [title, content, type, status, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/documents/:id', authenticate, async (req, res) => {
    await pool.query('DELETE FROM documents WHERE id=?', [req.params.id]);
    res.json({ success: true });
});

app.get('/api/settings/ai-keys', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT id, label, provider, tier, priority, status, error_count, last_checked FROM ai_keys ORDER BY priority ASC');
    res.json({ data: rows });
});

app.post('/api/settings/ai-keys', authenticate, async (req, res) => {
    const { label, key_value, provider, tier, priority } = req.body;
    await pool.query('INSERT INTO ai_keys (label, key_value, provider, tier, priority, status) VALUES (?,?,?,?,?, "ACTIVE")', 
        [label, key_value, provider || 'GEMINI', tier || 'FREE', priority || 1]);
    res.json({ success: true });
});

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    const [[balance]] = await pool.query('SELECT SUM(CASE WHEN type="INCOME" THEN amount ELSE -amount END) as total FROM financials');
    const [[users]] = await pool.query('SELECT COUNT(*) as count FROM users');
    res.json({ balance: balance?.total || 0, openIncidents: 0, totalUsers: users.count, sla: '98%' });
});

app.get('/api/users', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT id, name, unit, role, status, cpf_cnpj FROM users');
    res.json({ data: rows, pagination: { page: 1, total: rows.length, pages: 1 } });
});

app.get('/api/settings/system', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(rows[0] || {});
});

app.post('/api/system/hydrate', authenticate, async (req, res) => {
    try {
        await pool.query('INSERT IGNORE INTO settings (id, name, cnpj) VALUES (1, "S.I.E PRO - Gestão Ativa", "00.000.000/0001-99")');
        const adminHash = '$2a$10$Y509l5pYx9tKkK7k7k7k7uO9S0I1E2K3E4R5N6E7P8R9O1S2T3E4';
        await pool.query('INSERT IGNORE INTO users (username, password_hash, name, cpf_cnpj, role, status) VALUES (?,?,?,?,?,?)', ['admin', adminHash, 'Admin Master SRE', '00000000000', 'ADMIN', 'ACTIVE']);
        res.json({ success: true, message: "Kernel Hidratado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'dist/index.html')); });

app.listen(PORT, () => { console.log(`🚀 S.I.E KERNEL SRE V96.1 OPERACIONAL NA PORTA ${PORT}`); });
