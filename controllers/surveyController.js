import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

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
 * PUBLIC HANDSHAKE SUBMISSION
 */
export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    const cleanCPF = String(cpf).replace(/\D/g, '');
    
    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        let userId = existing[0]?.id;

        if (!userId && userData.name) {
            const [result] = await pool.query(
                'INSERT INTO users (name, cpf_cnpj, unit, email, phone, age, role, status, active) VALUES (?, ?, ?, ?, ?, ?, "RESIDENT", "PENDING", 1)',
                [userData.name, cleanCPF, userData.unit, userData.email, userData.phone, calculateAge(userData.birthDate)]
            );
            userId = result.insertId;
        } else if (userId) {
            await pool.query(
                'UPDATE users SET age = ?, unit = ?, email = ?, phone = ? WHERE id = ?',
                [calculateAge(userData.birthDate), userData.unit, userData.email, userData.phone, userId]
            );
        }

        await pool.query(
            'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId || null, cleanCPF, userData.name || 'Membro Externo', JSON.stringify(answers)]
        );

        res.json({ success: true, protocol: Date.now() });
    } catch (e) { 
        console.error("[SRE CENSO FAIL]", e);
        res.status(500).json({ error: "FALHA_AO_GRAVAR_RESPOSTA" }); 
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
 * SRE FIX: Log detalhado para identificar falhas de identificação perimetral.
 */
export const checkResident = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        console.log(`[SRE AUTH HANDSHAKE] Verificando: ${cleanCPF}`);
        
        const [rows] = await pool.query(
            'SELECT name, unit, email, phone, age, avatar_url FROM users WHERE cpf_cnpj = ?', 
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