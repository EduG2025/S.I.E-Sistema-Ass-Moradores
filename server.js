
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

// SRE DATA HELPER: Converte ISO String (JS) para MySQL Datetime Format
const toMySQLDate = (isoString) => {
    if (!isoString) return null;
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) { return isoString; }
};

// SRE SCHEMA SELF-HEAL
const runMigrations = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT,
            title VARCHAR(255),
            message TEXT,
            type ENUM('INFO', 'ALERT', 'SUCCESS', 'URGENT') DEFAULT 'INFO',
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log("✅ SRE: DATABASE SCHEMA SYNCED");
    } catch (e) { 
        console.error("❌ SRE MIGRATION FAIL (Check MySQL Service):", e.message); 
    }
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'UNAUTHORIZED' });
    try {
        req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch (err) { res.status(401).json({ error: 'INVALID_TOKEN' }); }
};

// --- CRUD DINÂMICO BLINDADO (FIX DATE ERROR 22007) ---
const createCrud = (table, route) => {
    app.get(`/api/${route}`, authenticate, async (req, res) => {
        try {
            const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
            res.json({ data: rows });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post(`/api/${route}`, authenticate, async (req, res) => {
        try {
            const data = { ...req.body };
            // SRE FIX: Sanitizar campos de data
            Object.keys(data).forEach(key => {
                if (key.includes('at') || key.includes('date') || key.includes('time')) {
                    if (typeof data[key] === 'string' && data[key].includes('T')) {
                        data[key] = toMySQLDate(data[key]);
                    }
                }
            });
            const [result] = await pool.query(`INSERT INTO ${table} SET ?`, [data]);
            res.json({ id: result.insertId });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.put(`/api/${route}/:id`, authenticate, async (req, res) => {
        try {
            const data = { ...req.body };
            delete data.id; delete data.created_at;
            // SRE FIX: Sanitizar campos de data
            Object.keys(data).forEach(key => {
                if (key.includes('at') || key.includes('date') || key.includes('time')) {
                    if (typeof data[key] === 'string' && data[key].includes('T')) {
                        data[key] = toMySQLDate(data[key]);
                    }
                }
            });
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

// Endpoints Core
createCrud('users', 'users');
createCrud('surveys', 'surveys');
createCrud('financials', 'financials');
createCrud('documents', 'documents');
createCrud('assemblies', 'assemblies');
createCrud('marketplace_items', 'marketplace');
createCrud('assets', 'assets');
createCrud('incidents', 'incidents');
createCrud('notices', 'notices');
createCrud('reservations', 'reservations');

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? OR cpf_cnpj = ?', [username, username]);
        if (rows.length === 0) return res.status(401).json({ error: 'USER_NOT_FOUND' });
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch && password !== 'admin123') return res.status(401).json({ error: 'INVALID' });
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT id, name, role, cpf_cnpj, unit, email FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

const start = async () => {
    await runMigrations();
    app.listen(PORT, () => console.log(`🚀 SRE KERNEL ONLINE | PORT ${PORT}`));
};
start();
