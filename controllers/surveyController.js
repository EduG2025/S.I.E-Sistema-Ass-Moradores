import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

/**
 * SRE Helper: Protocolo de Boas-vindas WhatsApp (Consistência de Gateway)
 */
const sendWelcomeProtocol = async (phone, name) => {
    if (!phone) return;
    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings?.whatsapp_config) return;
        let config = settings.whatsapp_config;
        if (typeof config === 'string') config = JSON.parse(config);

        if (config.api_key && config.sender) {
            const firstName = (name || 'Membro').split(' ')[0];
            const msg = (config.welcome_template || "Olá {nome}, seu cadastro via Censo S.I.E foi protocolado com sucesso no cluster residencial.")
                .replace(/\{nome\}/gi, firstName);

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

export const getPublicSurvey = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM surveys WHERE id = ? AND status = "ACTIVE"', [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'SURVEY_OFFLINE' });
        const survey = rows[0];
        if (typeof survey.questions === 'string') survey.questions = JSON.parse(survey.questions);
        res.json(survey);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const checkResident = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT name, unit, email, phone, avatar_url, birthDate FROM users WHERE cpf_cnpj = ?', [req.params.cpf]);
        if (rows.length) res.json({ found: true, ...rows[0] });
        else res.json({ found: false });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    try {
        const [existing] = await pool.query('SELECT id, socialData, avatar_url FROM users WHERE cpf_cnpj = ?', [cpf]);
        let userId = existing[0]?.id;
        const titularAge = calculateAge(userData.birthDate);

        const socialMapping = {
            risk: existing[0]?.socialData?.risk || 0,
            tags: existing[0]?.socialData?.tags || [],
            last_census_date: new Date().toISOString(),
            education_level: answers['edu_01'],
            nis_number: answers['soc_02'],
            birth_date: userData.birthDate
        };

        const avatarToSave = userData.avatar_url || existing[0]?.avatar_url || null;

        if (!userId) {
            const [result] = await pool.query('INSERT INTO users (name, cpf_cnpj, unit, email, phone, age, role, status, active, socialData, avatar_url) VALUES (?, ?, ?, ?, ?, ?, "RESIDENT", "PENDING", 1, ?, ?)',
                [userData.name, cpf, userData.unit, userData.email, userData.phone, titularAge, JSON.stringify(socialMapping), avatarToSave]);
            userId = result.insertId;
            // Welcome para novos residentes vindos do censo
            await sendWelcomeProtocol(userData.phone, userData.name);
        } else {
            await pool.query('UPDATE users SET unit = ?, email = ?, phone = ?, age = ?, socialData = ?, avatar_url = ? WHERE id = ?', 
                [userData.unit, userData.email, userData.phone, titularAge, JSON.stringify(socialMapping), avatarToSave, userId]);
        }

        await pool.query('INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId, cpf, userData.name, JSON.stringify(answers)]);

        await pool.query('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "SUBMIT_CENSUS", "survey_responses", ?, ?)',
            [userId || 0, surveyId, `Censo S.I.E PRO Protocolado por ${userData.name}.`]);

        res.json({ success: true, protocolId: Date.now() });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
