import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import https from 'https';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

/**
 * SRE Helper: Protocolo de Boas-vindas WhatsApp (Soberania via DB)
 * Resolve variáveis dinâmicas: {nome}, {unidade}, {sigla}, {senha}
 */
const sendWelcomeProtocol = async (phone, name, unit) => {
    if (!phone) return;
    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings?.whatsapp_config) return;

        let config = settings.whatsapp_config;
        if (typeof config === 'string') config = JSON.parse(config);

        if (config.api_key && config.sender) {
            const firstName = (name || 'Membro').split(' ')[0];
            const substitutionData = {
                nome: firstName,
                unidade: unit || 'HUB-SRE',
                sigla: settings.shortName || 'S.I.E PRO',
                senha: config.default_password || 'mudar123'
            };

            let msg = (config.welcome_template || "Olá {nome}, bem-vindo ao S.I.E PRO. Seu cadastro foi ativado com sucesso na unidade {unidade}. Sua senha de acesso é: {senha}");

            // Motor de substituição Regex
            Object.entries(substitutionData).forEach(([key, val]) => {
                const regex = new RegExp(`\\{${key}\\}`, 'gi');
                msg = msg.replace(regex, val);
            });

            await axios({
                method: 'post',
                url: 'https://jennyai.space/send-message',
                params: {
                    api_key: config.api_key,
                    sender: config.sender,
                    number: phone.replace(/\D/g, ''),
                    message: msg,
                    footer: config.footer || settings.shortName || "S.I.E PRO"
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                timeout: 10000
            });
            console.log(`[SRE] Welcome Message Processed for: ${phone} (Handshake OK)`);
        }
    } catch (e) {
        console.error("[SRE WELCOME MSG FAIL]", e.message);
    }
};

/**
 * S.I.E Neural DSL Search (V4.0)
 */
export const searchNeural = async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "QUERY_REQUIRED" });

    try {
        const aiResponse = await IAProviderManager.execute('intent_parsing', {
            contents: `Analise a intenção: "${query}". Converta para um filtro SQL (WHERE) para a tabela 'users'.
            Colunas: name, unit, age, role, status, socialData (json).
            Retorne JSON: { "sql_where": "string", "params": [], "use_grounding": boolean }`,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "Você é o compilador SQL do S.I.E. Gere cláusulas WHERE seguras."
            }
        });

        const intent = JSON.parse(aiResponse.text);
        let internalResults = [];

        if (intent.sql_where) {
            const sql = `SELECT id, name, unit, age, role, status, cpf_cnpj, phone, avatar_url, socialData, coordinates 
                         FROM users WHERE (${intent.sql_where}) AND active = 1 LIMIT 50`;
            const [rows] = await pool.query(sql, intent.params || []);
            
            internalResults = rows.map(r => {
                try {
                    if (r.socialData && typeof r.socialData === 'string') r.socialData = JSON.parse(r.socialData);
                    if (r.coordinates && typeof r.coordinates === 'string') r.coordinates = JSON.parse(r.coordinates);
                } catch(e) {}
                return r;
            });
        }

        let externalResults = [];
        if (intent.use_grounding || internalResults.length === 0) {
            const grounded = await IAProviderManager.execute('grounding', {
                contents: `Localize locais ou serviços relacionados a: "${query}" próximos a um cluster residencial.`,
                config: { tools: [{ googleSearch: {} }] }
            });
            externalResults = grounded.groundingChunks || [];
        }

        res.json({ internal: internalResults, external: externalResults, mode: internalResults.length > 0 ? 'PRECISION' : 'GROUNDING' });
    } catch (e) {
        res.status(500).json({ error: "FALHA_BUSCA_NEURAL" });
    }
};

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
        rows.forEach(r => {
            ['socialData', 'coordinates'].forEach(k => {
                if (r[k] && typeof r[k] === 'string') try { r[k] = JSON.parse(r[k]); } catch(e){}
            });
        });
        const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM users");
        res.json({ data: rows, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createUser = async (req, res) => {
    const { 
        name, cpf_cnpj, phone, email, role, unit, status, 
        address, neighborhood, city, state, zip_code, 
        avatar_url, socialData, age, rg, issuing_authority 
    } = req.body;
    
    try {
        const cleanCPF = cpf_cnpj.replace(/\D/g, '');
        if (cleanCPF.length < 11) return res.status(400).json({ error: "CPF_INVALIDO" });
        
        const [existing] = await pool.query("SELECT id FROM users WHERE cpf_cnpj = ?", [cleanCPF]);
        if (existing.length > 0) return res.status(400).json({ error: "CONFLITO_IDENTIDADE" });
        
        const passwordHash = await bcrypt.hash("mudar123", 10);
        
        const sql = `INSERT INTO users (
            name, cpf_cnpj, phone, email, role, unit, status, address, 
            neighborhood, city, state, zip_code, avatar_url, socialData, 
            age, rg, issuing_authority, password_hash, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;

        const [result] = await pool.query(sql, [
            name, cleanCPF, phone, email, role || 'RESIDENT', unit, status || 'ACTIVE', 
            address, neighborhood, city, state, zip_code, avatar_url, 
            JSON.stringify(socialData || {}), age, rg, issuing_authority, passwordHash
        ]);

        // Gatilho SRE: Disparo de Boas-vindas para novos membros ativos
        if ((status || 'ACTIVE') === 'ACTIVE' && phone) {
            await sendWelcomeProtocol(phone, name, unit);
        }

        res.json({ id: result.insertId, success: true });
    } catch (e) { 
        console.error("[SRE CREATE USER FAIL]", e.message);
        res.status(500).json({ error: e.message }); 
    }
};

export const activateUser = async (req, res) => {
    try {
        const [user] = await pool.query("SELECT name, phone, unit FROM users WHERE id = ?", [req.params.id]);
        await pool.query('UPDATE users SET status="ACTIVE", active=1 WHERE id=?', [req.params.id]);
        
        if (user[0] && user[0].phone) {
            await sendWelcomeProtocol(user[0].phone, user[0].name, user[0].unit);
        }
        
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDependents = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE parent_id = ?", [req.params.id]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const generateInvite = async (req, res) => {
    res.json({ success: true, link: `https://admcacaria.jennyai.space/census/1?invite=${req.params.id}` });
};