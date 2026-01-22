import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

/**
 * SRE Helper: Protocolo de Boas-vindas WhatsApp (Sincronizado V9.5)
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

            let msg = (config.welcome_template || "Olá {nome}, seu cadastro via Censo S.I.E foi protocolado com sucesso na unidade {unidade}. Sua senha de acesso é: {senha}");

            // Motor de substituição Regex (Standardizado)
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
            console.log(`[SRE CENSO] Welcome Protocol active for: ${phone}`);
        }
    } catch (e) { console.error("[SRE SURVEY WELCOME FAIL]", e.message); }
};

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
 * Recupera todas as respostas de um censo específico.
 */
export const getResponses = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM survey_responses WHERE survey_id = ? ORDER BY created_at DESC', [req.params.id]);
        rows.forEach(r => {
            if (r.answers && typeof r.answers === 'string') try { r.answers = JSON.parse(r.answers); } catch (e) {}
        });
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * Recupera o histórico de respostas de um morador pelo CPF (Dossiê Social).
 */
export const getResponsesByCpf = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        const [rows] = await pool.query('SELECT * FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC', [cleanCPF]);
        rows.forEach(r => {
            if (r.answers && typeof r.answers === 'string') try { r.answers = JSON.parse(r.answers); } catch (e) {}
        });
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * Motor de IA para sugerir perguntas baseadas no título do censo.
 */
export const suggestQuestions = async (req, res) => {
    const { title, description, type } = req.body;
    try {
        const prompt = `Crie 5 perguntas para um censo residencial com o título: "${title}".
        Descrição do contexto: "${description}".
        Tipo de análise: "${type}".
        Retorne estritamente um array JSON de objetos: [{ "text": "string", "type": "text|number|boolean|select", "options": ["opção1", "opção2"], "mapping_tag": "SOCIAL|HEALTH|WORK" }]`;

        const aiResponse = await IAProviderManager.execute('survey_suggestion', {
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "Você é o Arquiteto Social do S.I.E PRO. Suas sugestões devem focar em vulnerabilidade e governança."
            }
        });

        let data = aiResponse.text;
        if (typeof data === 'string') {
            data = data.replace(/```json|```/gi, '').trim();
            data = JSON.parse(data);
        }
        
        res.json({ data: Array.isArray(data) ? data : [] });
    } catch (e) {
        console.error("[SRE AI SUGGEST FAIL]", e.message);
        res.status(500).json({ error: "FALHA_IA_SUGGESTION" });
    }
};

/**
 * Handshake Público para carregar a estrutura do censo.
 */
export const getPublicSurvey = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'SURVEY_OFFLINE' });
        const survey = rows[0];
        if (typeof survey.questions === 'string') survey.questions = JSON.parse(survey.questions);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * Validação de residência prévia via CPF (Handshake V5).
 */
export const checkResident = async (req, res) => {
    try {
        const cleanCPF = req.params.cpf.replace(/\D/g, '');
        if (cleanCPF.length < 11) return res.status(400).json({ error: 'CPF_INVALIDO' });

        const [rows] = await pool.query('SELECT name, unit, email, phone, avatar_url, age FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        if (rows.length) res.json({ found: true, ...rows[0] });
        else res.json({ found: false });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * Protocolo de submissão de censo com Sincronização Dinâmica de Identidade (SRE V9.0)
 * Garante que dados do Censo atualizem o cadastro de membro automaticamente.
 */
export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    const cleanCPF = String(cpf).replace(/\D/g, '');

    try {
        // 1. Localizar registro de identidade existente
        const [existing] = await pool.query('SELECT id, socialData, avatar_url, role FROM users WHERE cpf_cnpj = ?', [cleanCPF]);
        let userId = existing[0]?.id;
        const titularAge = calculateAge(userData.birthDate);

        // 2. Mapeamento de Inteligência Social (Merging current response)
        const socialMapping = {
            risk: existing[0]?.socialData?.risk || 0,
            tags: existing[0]?.socialData?.tags || ["CENSO_2025"],
            last_census_date: new Date().toISOString(),
            education_level: answers['edu_01'] || answers['q1'], // Suporte a mapeamento genérico
            nis_number: answers['soc_02'],
            birth_date: userData.birthDate,
            last_answers: answers
        };

        const avatarToSave = userData.avatar_url || existing[0]?.avatar_url || null;

        // 3. FLUXO UPSERT: Sincronização Dinâmica no Painel de Cadastro
        if (!userId) {
            // Criação de Novo Membro via Censo
            const [result] = await pool.query(
                'INSERT INTO users (name, cpf_cnpj, unit, email, phone, age, role, status, active, socialData, avatar_url) VALUES (?, ?, ?, ?, ?, ?, "RESIDENT", "ACTIVE", 1, ?, ?)',
                [userData.name, cleanCPF, userData.unit, userData.email, userData.phone, titularAge, JSON.stringify(socialMapping), avatarToSave]
            );
            userId = result.insertId;
            await sendWelcomeProtocol(userData.phone, userData.name, userData.unit);
        } else {
            // Atualização de Membro Existente (Handshake de Dados Reais)
            const updateFields = 'name = ?, unit = ?, email = ?, phone = ?, age = ?, socialData = ?, avatar_url = ?';
            const params = [userData.name, userData.unit, userData.email, userData.phone, titularAge, JSON.stringify(socialMapping), avatarToSave, userId];
            
            await pool.query(`UPDATE users SET ${updateFields} WHERE id = ?`, params);
        }

        // 4. Registrar Resposta no Ledger de Auditoria Social
        await pool.query(
            'INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId, cleanCPF, userData.name, JSON.stringify(answers)]
        );

        // 5. Registrar Log de Alteração SRE
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "SUBMIT_CENSUS", "survey_responses", ?, ?)',
            [userId || 0, surveyId, `Sincronização Dinâmica do perfil de ${userData.name} via Censo Digital.`]
        );

        res.json({ 
            success: true, 
            protocolId: Date.now(),
            syncStatus: 'SYNCHRONIZED',
            memberId: userId
        });
    } catch (e) {
        console.error("[SRE SUBMIT FAIL]", e.message);
        res.status(500).json({ error: "FALHA_AO_PROTOCOLAR_CENSO", details: e.message });
    }
};