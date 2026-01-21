
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import https from 'https';

const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_production_master_2025';

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let q = "SELECT * FROM users";
        let params = [];
        
        if (search) {
            q += " WHERE name LIKE ? OR cpf_cnpj LIKE ? OR unit LIKE ?";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        q += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(q, params);
        
        // Sanitize JSON fields
        rows.forEach(r => {
            ['socialData', 'coordinates'].forEach(k => {
                if (r[k] && typeof r[k] === 'string') try { r[k] = JSON.parse(r[k]); } catch(e){}
            });
        });

        const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM users");
        
        res.json({ 
            data: rows,
            pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * SRE CRITICAL MODULE: CREATE USER WITH HANDSHAKE
 * Validação rigorosa e disparo de boas-vindas.
 */
export const createUser = async (req, res) => {
    const { name, cpf_cnpj, phone, email, role, unit, status, address, neighborhood, city, state, zip_code } = req.body;
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        // 1. Normalização e Validação
        const cleanCPF = cpf_cnpj.replace(/\D/g, '');
        const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

        if (cleanCPF.length < 11) return res.status(400).json({ error: "CPF_DOCUMENTO_INVALIDO" });

        // 2. Verificar duplicidade
        const [existing] = await pool.query("SELECT id FROM users WHERE cpf_cnpj = ?", [cleanCPF]);
        if (existing.length > 0) return res.status(400).json({ error: "CONFLITO_IDENTIDADE: CPF já registrado." });

        // 3. Buscar configurações para senha e template
        const [[settings]] = await pool.query("SELECT whatsapp_config FROM settings WHERE id = 1");
        let waConfig = settings?.whatsapp_config;
        if (typeof waConfig === 'string') waConfig = JSON.parse(waConfig);

        const defaultPass = waConfig?.default_password || "mudar123";
        const passwordHash = await bcrypt.hash(defaultPass, 10);

        // 4. Commitar no Banco de Dados
        const [result] = await pool.query(
            "INSERT INTO users (name, cpf_cnpj, phone, email, role, unit, status, address, neighborhood, city, state, zip_code, password_hash, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
            [name, cleanCPF, cleanPhone, email, role || 'RESIDENT', unit, status || 'ACTIVE', address, neighborhood, city, state, zip_code, passwordHash]
        );

        const userId = result.insertId;

        // 5. Auditoria SRE
        await pool.query('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "CREATE_USER", "users", ?, ?)',
            [req.user?.id || 0, userId, `Membro ${name} protocolado via Master UI.`]);

        // 6. Handshake WhatsApp (Boas-vindas)
        if (cleanPhone && waConfig?.api_key && waConfig?.welcome_template) {
            try {
                const firstName = name.split(' ')[0];
                const msg = waConfig.welcome_template
                    .replace(/\{nome\}/gi, firstName)
                    .replace(/\{senha\}/gi, defaultPass);

                await axios({
                    method: 'post',
                    url: 'https://jennyai.space/send-message',
                    params: {
                        api_key: waConfig.api_key,
                        sender: waConfig.sender,
                        number: cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`,
                        message: msg,
                        footer: waConfig.footer || "S.I.E PRO"
                    },
                    timeout: 10000,
                    httpsAgent: agent
                });
            } catch (err) {
                console.error("[SRE WELCOME FAIL]", err.message);
            }
        }

        res.json({ id: userId, success: true });

    } catch (e) {
        console.error("[SRE USER CREATE PANIC]", e);
        res.status(500).json({ error: e.message });
    }
};

export const generateInvite = async (req, res) => {
    try {
        const token = jwt.sign({ id: req.params.id, type: 'INVITE' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const activateUser = async (req, res) => {
    try {
        await pool.query('UPDATE users SET status="ACTIVE", active=1 WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDependents = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE parent_id = ?", [req.params.id]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
