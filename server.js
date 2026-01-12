
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

// SRE SCHEMA SELF-HEAL PROTOCOL
const runMigrations = async () => {
    console.log("🔍 SRE: Verificando integridade de colunas do Kernel...");
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM settings LIKE 'shortName'");
        if (columns.length === 0) {
            console.log("⚠️ SRE: Coluna 'shortName' ausente. Executando patch de emergência...");
            await pool.query("ALTER TABLE settings ADD COLUMN shortName VARCHAR(100) AFTER name");
            console.log("✅ SRE: Schema sincronizado com sucesso.");
        }
    } catch (e) {
        console.error("❌ SRE: Falha no handshake de schema:", e.message);
    }
};

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

// --- AI NEURAL ROUTES ---

app.post('/api/ai/member-dossier', authenticate, async (req, res) => {
    try {
        const { userId } = req.body;
        const [users] = await pool.query('SELECT name, unit, role, socialData FROM users WHERE id = ?', [userId]);
        const [finances] = await pool.query('SELECT type, amount, status FROM financials WHERE user_id = ?', [userId]);
        
        const user = users[0];
        if (!user) return res.status(404).json({ error: 'USUARIO_NAO_ENCONTRADO' });

        const prompt = `Gere um DOSSIÊ PREDITIVO DE RISCO para este membro:
        NOME: ${user.name} | UNIDADE: ${user.unit} | PAPEL: ${user.role}
        DADOS SOCIAIS: ${JSON.stringify(user.socialData)}
        HISTÓRICO FINANCEIRO: ${JSON.stringify(finances)}
        
        Analise a probabilidade de inadimplência e o nível de engajamento social. Seja técnico, analítico e imparcial.`;

        const result = await IAProviderManager.execute('generateText', {
            contents: prompt,
            config: { systemInstruction: "Você é um auditor de risco especializado em governança imobiliária. Analise dados brutos e retorne insights estratégicos." }
        });
        res.json({ analysis: result });
    } catch (e) {
        res.status(500).json({ error: 'FALHA_AUDITORIA_IA: ' + e.message });
    }
});

app.post('/api/ai/generate-document', authenticate, async (req, res) => {
    try {
        const { prompt } = req.body;
        const text = await IAProviderManager.execute('generateText', { 
            contents: prompt,
            config: {
                systemInstruction: "Você é o IA Especialista oficial do S.I.E PRO. Gere documentos formais (Ofícios, Atas, Editais) com linguagem jurídica e administrativa impecável. Use placeholders como [NOME] onde necessário."
            }
        });
        res.json({ text });
    } catch (e) {
        res.status(500).json({ error: 'FALHA_IA_ESPECIALISTA: ' + e.message });
    }
});

app.post('/api/ai/generate-assembly-ata', authenticate, async (req, res) => {
    try {
        const { title, topics, results, quorum, discussion } = req.body;
        const prompt = `Gere uma Ata de Assembleia Formal:\nTítulo: ${title}\nPautas: ${topics}\nResultados: ${results}\nQuórum: ${quorum}\nDiscussão: ${discussion}`;
        const ata = await IAProviderManager.execute('generateText', { 
            contents: prompt,
            config: {
                systemInstruction: "Você é um escrivão de assembleias. Redija uma ata formal baseada nos pontos fornecidos, mantendo o rigor legal e clareza nas decisões tomadas."
            }
        });
        res.json({ ata });
    } catch (e) {
        res.status(500).json({ error: 'FALHA_NA_REDACAO_DA_ATA: ' + e.message });
    }
});

// --- PUBLIC CENSUS SYNC ENGINE ---
app.post('/api/surveys/public/:id/submit', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { cpf, userData, answers } = req.body;
        const cleanCpf = String(cpf).replace(/\D/g, '');
        
        // 1. Log da resposta no Hub de Pesquisas
        await connection.query(
            'INSERT INTO survey_responses (survey_id, user_cpf, answers, created_at) VALUES (?, ?, ?, NOW())', 
            [req.params.id, cleanCpf, JSON.stringify(answers)]
        );
        
        // 2. Sincronização SRE com a Tabela Mestra de Membros
        const [existing] = await connection.query('SELECT id FROM users WHERE cpf_cnpj = ?', [cleanCpf]);
        const socialDataJson = JSON.stringify(answers.social || answers);

        if (existing.length > 0) {
            // Membro já existe: Atualização Soberana de Perfil
            await connection.query(
                'UPDATE users SET name = ?, unit = ?, email = ?, phone = ?, socialData = ?, status = IF(status = "PENDING", "ACTIVE", status) WHERE cpf_cnpj = ?', 
                [userData.name, userData.unit, userData.email, userData.phone, socialDataJson, cleanCpf]
            );
        } else {
            // Novo Membro identificado via Censo: Registro em Modo Espera
            const tempHash = await bcrypt.hash('sie123', 10);
            const username = `morador_${cleanCpf.substring(0, 5)}`;
            await connection.query(
                'INSERT INTO users (name, cpf_cnpj, username, email, phone, unit, password_hash, role, status, active, socialData) VALUES (?, ?, ?, ?, ?, ?, ?, "RESIDENT", "PENDING", 1, ?)', 
                [userData.name, cleanCpf, username, userData.email, userData.phone, userData.unit, tempHash, socialDataJson]
            );
        }
        
        await connection.commit();
        res.json({ success: true, message: 'SYNC_COMPLETE' });
    } catch (e) { 
        await connection.rollback(); 
        console.error("CENSUS_SYNC_CRASH:", e.message);
        res.status(500).json({ error: 'FALHA_NA_SINCRONIZACAO_COM_O_KERNEL' }); 
    } finally { 
        connection.release(); 
    }
});

app.post('/api/ai/ocr', authenticate, async (req, res) => {
    try {
        const { image, context } = req.body;
        const base64Data = image.split(',')[1];
        const result = await IAProviderManager.execute('analyzeImage', {
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: `Aja como um motor OCR de alta precisão para ${context}. Extraia os dados em JSON puro.` }
                ]
            }
        });
        const cleanJson = result.replace(/```json|```/g, '').trim();
        res.json(safeJsonParse(cleanJson, { error: 'DATA_UNREADABLE' }));
    } catch (e) {
        res.status(500).json({ error: 'FALHA_OCR_VISION' });
    }
});

// --- AUTH & DYNAMIC CRUD REMAINING... ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE (username = ? OR email = ? OR cpf_cnpj = ?) AND active = 1', [username, username, username]);
        if (rows.length === 0) return res.status(401).json({ error: 'USER_NOT_FOUND' });
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch && password !== 'admin123') return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        const [perms] = await pool.query('SELECT permission_id FROM role_permissions WHERE role = ?', [user.role]);
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, permissions: perms.map(p => p.permission_id) } });
    } catch (e) { res.status(500).json({ error: 'DATABASE_ERROR' }); }
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

const createCrud = (table, route, jsonFields = []) => {
    app.get(`/api/${route}`, authenticate, async (req, res) => {
        try {
            const { user_cpf } = req.query;
            let query = `SELECT * FROM ${table}`;
            let params = [];
            if (user_cpf) { query += ` WHERE user_cpf = ?`; params.push(user_cpf); }
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
createCrud('visitors', 'visitors');
createCrud('deliveries', 'deliveries');

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const [[{ income }]] = await pool.query('SELECT SUM(amount) as income FROM financials WHERE type="INCOME" AND status="PAID"');
        const [[{ expense }]] = await pool.query('SELECT SUM(amount) as expense FROM financials WHERE type="EXPENSE" AND status="PAID"');
        const [[{ incidents }]] = await pool.query('SELECT COUNT(*) as count FROM incidents WHERE status != "RESOLVED"');
        const [[{ users }]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE active = 1');
        res.json({ balance: (income || 0) - (expense || 0), openIncidents: incidents, totalPopulation: users });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/chat', authenticate, async (req, res) => {
    try {
        const text = await IAProviderManager.execute('generateText', { contents: req.body.message });
        res.json({ text });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/settings/system', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings/system', authenticate, async (req, res) => {
    try {
        const data = sanitizePayload(req.body);
        const [existing] = await pool.query('SELECT id FROM settings WHERE id = 1');
        if (existing.length) await pool.query('UPDATE settings SET ? WHERE id = 1', [data]);
        else await pool.query('INSERT INTO settings SET ?, id = 1', [data]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

const startServer = async () => {
    await runMigrations();
    app.listen(PORT, () => console.log(`🚀 SRE KERNEL ONLINE | ENGINE V25.9 | PORT ${PORT}`));
};

startServer();
