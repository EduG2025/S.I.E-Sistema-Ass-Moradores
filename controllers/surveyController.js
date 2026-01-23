import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import bcrypt from 'bcryptjs';

const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
};

const parseField = (field) => {
    if (!field) return [];
    if (typeof field === 'object') return field;
    try { return JSON.parse(field); } catch (e) { return []; }
};

export const getAllSurveys = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM surveys ORDER BY created_at DESC");
        rows.forEach(r => r.questions = parseField(r.questions));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "DATABASE_READ_ERROR" }); }
};

/**
 * IA QUESTION SUGGESTION
 */
export const suggestQuestions = async (req, res) => {
    const { title, description } = req.body;
    try {
        const prompt = `Aja como Arquiteto Social. Gere 8 perguntas estratégicas para um censo: "${title}". Objetivo: ${description}. Retorne JSON: Array<{ "text": string, "type": "text|number|boolean|select", "options": string[], "mapping_tag": string }>`;

        const aiResponse = await IAProviderManager.execute('survey_suggestion', {
            model: IAProviderManager.MODELS.FAST,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "Retorne apenas o array JSON puro."
            }
        });

        res.json({ data: JSON.parse(aiResponse.text) });
    } catch (e) { res.status(500).json({ error: "IA_SUGGESTION_FAIL" }); }
};

/**
 * PUBLIC HANDSHAKE SUBMISSION (V240.2 Master)
 * Persistência unificada com a tabela users.
 */
export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    const cleanCPF = String(cpf).replace(/\D/g, '');
    
    try {
        const [existing] = await pool.query('SELECT id, status FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        let userId = existing[0]?.id;

        // Hash de senha se fornecida
        let passwordHash = null;
        if (userData.password) {
            passwordHash = await bcrypt.hash(userData.password, 10);
        }

        const userPayload = {
            name: userData.name,
            unit: userData.unit,
            email: userData.email,
            phone: userData.phone,
            whatsapp: userData.whatsapp,
            address: userData.address,
            profession: userData.profession,
            age: calculateAge(userData.birth_date),
            birth_date: userData.birth_date,
            rg: userData.rg,
            issuing_authority: userData.issuing_authority,
            gender: userData.gender,
            resident_type: userData.resident_type,
            voting_rights: userData.voting_rights,
            role: userData.role || 'RESIDENT',
            preferred_channel: userData.preferred_channel || 'WHATSAPP',
            avatar_url: userData.avatar_url,
            active: 1
        };

        if (passwordHash) {
            userPayload.password_hash = passwordHash;
        }

        if (!userId) {
            // Novo Registro via Censo
            userPayload.cpf_cnpj = cleanCPF;
            userPayload.status = 'PENDING';
            const [result] = await pool.query('INSERT INTO users SET ?', [userPayload]);
            userId = result.insertId;
        } else {
            // Atualização de Membro Existente
            await pool.query('UPDATE users SET ? WHERE id = ?', [userPayload, userId]);
        }

        // Grava as respostas do censo para BI histórico
        await pool.query(
            'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId, cleanCPF, userData.name || 'Membro Externo', JSON.stringify(answers)]
        );

        // Registro de Auditoria SRE
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, ?, "users", ?, ?)',
            [userId, existing.length > 0 ? "UPDATE_VIA_PUBLIC_CENSUS" : "REGISTER_VIA_PUBLIC_CENSUS", userId, `Protocolo Censo #${surveyId}`]
        );

        res.json({ success: true, protocol: Date.now() });
    } catch (e) { 
        console.error("[SRE CENSO FAIL]", e);
        res.status(500).json({ error: "FALHA_AO_GRAVAR_RESPOSTA: " + e.message }); 
    }
};

export const getResponses = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE survey_id = ? ORDER BY created_at DESC", [req.params.id]);
        rows.forEach(r => r.answers = parseField(r.answers));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_FETCH_DATA" }); }
};

export const getPublicSurvey = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'CENSO_INDISPONIVEL' });
        const survey = rows[0];
        survey.questions = parseField(survey.questions);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: "ERRO_FORM_PUBLICO" }); }
};

/**
 * CHECK RESIDENT HANDSHAKE
 */
export const checkResident = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        console.log(`[SRE AUTH HANDSHAKE] Verificando: ${cleanCPF}`);
        
        const [rows] = await pool.query(
            'SELECT name, unit, email, phone, age, avatar_url, rg, issuing_authority, gender, birth_date, resident_type, voting_rights, role, status, whatsapp, preferred_channel, address, profession FROM users WHERE cpf_cnpj = ?', 
            [cleanCPF]
        );
        
        if (rows.length > 0) {
            console.log(`[SRE AUTH HANDSHAKE] Membro LOCALIZADO: ${rows[0].name}`);
            res.json({ found: true, ...rows[0] });
        } else {
            console.log(`[SRE AUTH HANDSHAKE] Membro NÃO LOCALIZADO: Iniciando Fluxo Externo.`);
            res.json({ found: false });
        }
    } catch (e) { 
        console.error("[SRE CHECK RESIDENT FAIL]", e);
        res.status(500).json({ error: "ERRO_VALIDACAO_KERNEL" }); 
    }
};

export const getResponsesByCpf = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC", [cleanCPF]);
        rows.forEach(r => r.answers = parseField(r.answers));
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "ERRO_HISTORICO_MEMBRO" }); }
};