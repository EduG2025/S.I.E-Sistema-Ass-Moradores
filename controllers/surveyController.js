import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import https from 'https';

/**
 * SRE Utils: Cálculo de idade biográfica
 */
const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
};

/**
 * SRE Helper: Parser seguro de campos JSON
 */
const parseField = (field) => {
    if (!field) return [];
    if (typeof field === 'object') return field;
    try { 
        return typeof field === 'string' ? JSON.parse(field) : field; 
    } catch (e) { 
        return []; 
    }
};

/**
 * SRE Helper: Limpeza de resposta JSON da IA (remove markdown blocks)
 */
const cleanAIJsonResponse = (text) => {
    if (!text) return "[]";
    return text.replace(/```json|```/g, "").trim();
};

/**
 * SRE Personalization Engine: Resolve variáveis contextuais em templates.
 */
const resolveTemplate = (content, data) => {
    if (!content) return "";
    let resolved = content;
    Object.entries(data).forEach(([key, val]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        resolved = resolved.replace(regex, val || '---');
    });
    return resolved;
};

/**
 * SRE WELCOME DISPATCHER
 * Dispara mensagem de boas-vindas via Gateway externo.
 */
const sendWelcomeMessage = async (userData, shortName) => {
    if (!userData.phone) return;
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config FROM settings WHERE id = 1');
        let config = settings?.whatsapp_config;
        if (config && typeof config === 'string') config = JSON.parse(config);

        if (!config?.welcome_msg || !config?.api_key) return;

        const [[tpl]] = await pool.query("SELECT content FROM message_templates WHERE event_trigger = 'WELCOME_CENSUS' AND is_active = 1 LIMIT 1");

        const welcomeText = tpl?.content || `Olá {nome}! Bem-vindo ao cluster {sigla}. Seu registro foi protocolado com sucesso no censo digital.`;

        const personalized = resolveTemplate(welcomeText, {
            nome: (userData.name || 'Membro').split(' ')[0],
            unidade: userData.unit || 'HUB',
            sigla: shortName
        });

        await axios({
            method: 'post',
            url: config.gateway_url || 'https://jennyai.space/send-message',
            params: {
                api_key: config.api_key,
                sender: config.sender,
                number: userData.phone.replace(/\D/g, ''),
                message: personalized,
                footer: config.footer || shortName
            },
            timeout: 10000,
            httpsAgent: agent
        });

        console.log(`[SRE WELCOME] Mensagem enviada para: ${userData.phone}`);
    } catch (e) {
        console.error(`[SRE WELCOME FAIL] Erro no disparo: ${e.message}`);
    }
};

// --- CONTROLLERS ---

export const getAllSurveys = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM surveys ORDER BY created_at DESC");
        rows.forEach(r => r.questions = parseField(r.questions));
        res.json({ data: rows });
    } catch (e) { 
        res.status(500).json({ error: "DATABASE_READ_ERROR" }); 
    }
};

export const suggestQuestions = async (req, res) => {
    const { title, description } = req.body;
    try {
        const prompt = `Aja como Arquiteto Social. Gere 8 perguntas estratégicas para um censo: "${title}". Objetivo: ${description}. Retorne APENAS um Array JSON: Array<{ "text": string, "type": "text|number|boolean|select", "options": string[], "mapping_tag": string }>`;

        const aiResponse = await IAProviderManager.execute('survey_suggestion', {
            model: IAProviderManager.MODELS.FAST,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                systemInstruction: "Retorne apenas o array JSON puro, sem explicações."
            }
        });

        const cleanedData = JSON.parse(cleanAIJsonResponse(aiResponse.text));
        res.json({ data: cleanedData });
    } catch (e) { 
        console.error("[SRE IA FAIL]", e);
        res.status(500).json({ error: "IA_SUGGESTION_FAIL" }); 
    }
};

/**
 * SRE CENSO SUBMIT V12.6
 * ATOMIC PERSISTENCE: Garante integridade entre Usuário e Resposta.
 */
export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    const cleanCPF = String(cpf).replace(/\D/g, '');

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Contexto do Sistema
        const [[sys]] = await connection.query('SELECT shortName FROM settings WHERE id = 1');
        const [existing] = await connection.query('SELECT id, socialData FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        let userId = existing[0]?.id;

        // 2. Inteligência Social (Merge de Perfil)
        let currentSocial = parseField(existing[0]?.socialData);
        const mergedSocialData = { ...currentSocial, ...answers };

        // 3. Payload de Usuário
        const userPayload = {
            name: (userData.name || '').toUpperCase(),
            unit: userData.unit,
            email: userData.email,
            phone: userData.phone,
            whatsapp: userData.whatsapp,
            cep: userData.cep,
            street: userData.street,
            number: userData.number,
            complement: userData.complement,
            neighborhood: userData.neighborhood,
            city: userData.city,
            state: userData.state,
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
            socialData: JSON.stringify(mergedSocialData),
            active: 1
        };

        if (userData.password) {
            userPayload.password_hash = await bcrypt.hash(userData.password, 10);
        }

        // 4. Upsert do Usuário
        if (!userId) {
            userPayload.cpf_cnpj = cleanCPF;
            userPayload.status = 'PENDING';
            const [result] = await connection.query('INSERT INTO users SET ?', [userPayload]);
            userId = result.insertId;
        } else {
            await connection.query('UPDATE users SET ? WHERE id = ?', [userPayload, userId]);
        }

        // 5. Registro da Resposta (Social Ledger)
        await connection.query(
            'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId, cleanCPF, userData.name || 'Membro Externo', JSON.stringify(answers)]
        );

        // 6. Auditoria
        const auditAction = existing.length > 0 ? "UPDATE_VIA_CENSUS" : "REGISTER_VIA_CENSUS";
        await connection.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, ?, "users", ?, ?)',
            [userId, auditAction, userId, `Censo Digital #${surveyId} Protocolado`]
        );

        // Commit da Transação
        await connection.commit();

        // 7. Ações de Segundo Plano (Não travam o cliente)
        sendWelcomeMessage(userPayload, sys?.shortName || 'S.I.E');

        res.json({ success: true, protocol: Date.now(), userId });

    } catch (e) {
        await connection.rollback();
        console.error("[SRE CENSO CRITICAL FAIL]", e);
        res.status(500).json({ error: "FALHA_AO_GRAVAR: " + e.message });
    } finally {
        connection.release();
    }
};

export const getResponses = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE survey_id = ? ORDER BY created_at DESC", [req.params.id]);
        rows.forEach(r => r.answers = parseField(r.answers));
        res.json({ data: rows });
    } catch (e) { 
        res.status(500).json({ error: "ERRO_FETCH_DATA" }); 
    }
};

export const getAllSurveyResponses = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM survey_responses ORDER BY created_at DESC");
        rows.forEach(r => r.answers = parseField(r.answers));
        res.json({ data: rows });
    } catch (e) {
        res.status(500).json({ error: "ERRO_FETCH_ALL_DATA" });
    }
};

export const getPublicSurvey = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'CENSO_INDISPONIVEL' });
        const survey = rows[0];
        survey.questions = parseField(survey.questions);
        res.json(survey);
    } catch (e) { 
        res.status(500).json({ error: "ERRO_FORM_PUBLICO" }); 
    }
};

export const checkResident = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query(
            `SELECT name, unit, email, phone, age, avatar_url, rg, issuing_authority, gender, birth_date, resident_type, voting_rights, role, status, whatsapp, preferred_channel, profession, cep, street, number, complement, neighborhood, city, state FROM users WHERE cpf_cnpj = ?`,
            [cleanCPF]
        );
        if (rows.length > 0) {
            res.json({ found: true, ...rows[0] });
        } else {
            res.json({ found: false });
        }
    } catch (e) {
        res.status(500).json({ error: "ERRO_VALIDACAO_KERNEL" });
    }
};

export const getResponsesByCpf = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query("SELECT * FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC", [cleanCPF]);
        rows.forEach(r => r.answers = parseField(r.answers));
        res.json({ data: rows });
    } catch (e) { 
        res.status(500).json({ error: "ERRO_HISTORICO_MEMBRO" }); 
    }
};