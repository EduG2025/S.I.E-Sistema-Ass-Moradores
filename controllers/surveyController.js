import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

/**
 * SRE Helper: Cálculo de idade cronológica.
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
 * SRE Protocol: Envio de Mensagem de Boas-vindas/Confirmação (Bridge JennyAI).
 */
const sendConfirmationProtocol = async (phone, name, unit) => {
    if (!phone) return;
    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings?.whatsapp_config) return;
        
        let config = settings.whatsapp_config;
        if (typeof config === 'string') config = JSON.parse(config);

        if (config.api_key && config.sender) {
            const firstName = (name || 'Membro').split(' ')[0];
            const msg = `Olá ${firstName}, seus dados foram protocolados com sucesso via Censo Digital ${settings.shortName}. Sua participação é fundamental para nossa co-gestão ativa!`;

            await axios({
                method: 'post',
                url: 'https://jennyai.space/send-message',
                params: {
                    api_key: config.api_key,
                    sender: config.sender,
                    number: phone.replace(/\D/g, ''),
                    message: msg,
                    footer: config.footer || settings.shortName
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                timeout: 8000
            });
            console.log(`[SRE CENSO] Confirmation dispatched to: ${phone}`);
        }
    } catch (e) { console.error("[SRE ALERT] Notification failed:", e.message); }
};

/**
 * Motor de IA para sugerir perguntas complexas (Gemini 3 Flash).
 */
export const suggestQuestions = async (req, res) => {
    const { title, description, type } = req.body;
    try {
        const prompt = `Gere 6 perguntas técnicas para um censo residencial com o título: "${title}". 
        Contexto: "${description}". Tipo de análise: "${type}".
        Retorne estritamente um array JSON: [{ "text": "string", "type": "text|number|boolean|select", "options": ["opção1", "..."], "mapping_tag": "HEALTH|FINANCE|WORK" }]`;

        const aiResponse = await IAProviderManager.execute('survey_suggestion', {
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "Você é o Arquiteto Social Senior do S.I.E PRO. Foco em vulnerabilidade e governança participativa."
            }
        });

        let data = aiResponse.text;
        if (typeof data === 'string') {
            data = data.replace(/```json|```/gi, '').trim();
            data = JSON.parse(data);
        }
        res.json({ data: Array.isArray(data) ? data : [] });
    } catch (e) { res.status(500).json({ error: "IA_SUGGESTION_FAILURE" }); }
};

/**
 * Protocolo de submissão Handshake V5 (Sincronização Dinâmica).
 */
export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    const cleanCPF = String(cpf).replace(/\D/g, '');

    try {
        // 1. Busca por identidade existente no cluster
        const [existing] = await pool.query('SELECT id, socialData, avatar_url FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        let userId = existing[0]?.id;
        const currentAge = calculateAge(userData.birthDate);

        // 2. Compor Matriz de Inteligência Social
        const socialMapping = {
            risk: existing[0]?.socialData?.risk || 0,
            tags: existing[0]?.socialData?.tags || ["AUTO_CENSO_2025"],
            last_census_date: new Date().toISOString(),
            last_answers: answers
        };

        const avatarToSave = userData.avatar_url || existing[0]?.avatar_url || null;

        // 3. UPSERT LOGIC: Garantir integridade do cadastro core
        if (!userId) {
            const [result] = await pool.query(
                'INSERT INTO users (name, cpf_cnpj, unit, email, phone, age, role, status, active, socialData, avatar_url) VALUES (?, ?, ?, ?, ?, ?, "RESIDENT", "ACTIVE", 1, ?, ?)',
                [userData.name, cleanCPF, userData.unit, userData.email, userData.phone, currentAge, JSON.stringify(socialMapping), avatarToSave]
            );
            userId = result.insertId;
        } else {
            await pool.query(
                'UPDATE users SET name = ?, unit = ?, email = ?, phone = ?, age = ?, socialData = ?, avatar_url = ? WHERE id = ?',
                [userData.name, userData.unit, userData.email, userData.phone, currentAge, JSON.stringify(socialMapping), avatarToSave, userId]
            );
        }

        // 4. Registro no Ledger de Respostas
        await pool.query(
            'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId, cleanCPF, userData.name, JSON.stringify(answers)]
        );

        // 5. Auditoria SRE
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "SYNC_CENSUS", "survey_responses", ?, ?)',
            [userId, surveyId, `Sincronização dinâmica de perfil: ${userData.name}. Bio-ID Ativo.`]
        );

        // 6. Notificação via Bridge (Async)
        sendConfirmationProtocol(userData.phone, userData.name, userData.unit);

        res.json({ success: true, protocol: Date.now(), sync: 'OK' });
    } catch (e) {
        console.error("[SRE SUBMIT FAIL]", e.message);
        res.status(500).json({ error: "FALHA_AO_PROTOCOLAR_CENSO" });
    }
};

/**
 * Handshake de Identidade (Check prévio).
 */
export const checkResident = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query('SELECT name, unit, email, phone, avatar_url, age FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        if (rows.length) res.json({ found: true, ...rows[0] });
        else res.json({ found: false });
    } catch (e) { res.status(500).json({ error: "CHECK_FAILURE" }); }
};

/**
 * Recuperação de Estrutura Pública.
 */
export const getPublicSurvey = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'OFFLINE' });
        const survey = rows[0];
        if (typeof survey.questions === 'string') survey.questions = JSON.parse(survey.questions);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: "DB_FAILURE" }); }
};