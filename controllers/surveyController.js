
import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

/**
 * SRE Utils: Cálculo de idade cronológica
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
        const [rows] = await pool.query('SELECT name, unit, email, phone FROM users WHERE cpf_cnpj = ?', [req.params.cpf]);
        if (rows.length) res.json({ found: true, ...rows[0] });
        else res.json({ found: false });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const submitResponse = async (req, res) => {
    const { cpf, userData, answers } = req.body;
    const surveyId = req.params.surveyId;
    try {
        const [existing] = await pool.query('SELECT id, socialData FROM users WHERE cpf_cnpj = ?', [cpf]);
        let userId = existing[0]?.id;
        
        // SRE: Cálculo de Idade do Titular
        const titularAge = calculateAge(userData.birthDate);

        // Mapeamento Inteligente de Atributos do Censo para o Core do Usuário
        const socialMapping = {
            risk: existing[0]?.socialData?.risk || 0,
            tags: existing[0]?.socialData?.tags || [],
            last_census_date: new Date().toISOString(),
            education_level: answers['edu_01'],
            nis_number: answers['soc_02'],
            birth_date: userData.birthDate,
            benefits: [
                answers['soc_03'] === 'SIM' ? 'BOLSA_FAMILIA' : null,
                answers['soc_04'] === 'SIM' ? 'BPC' : null,
                answers['soc_05'] === 'SIM' ? 'TARIFA_SOCIAL' : null
            ].filter(Boolean)
        };

        if (!userId) {
            const [result] = await pool.query('INSERT INTO users (name, cpf_cnpj, unit, email, phone, age, role, status, active, socialData) VALUES (?, ?, ?, ?, ?, ?, "RESIDENT", "PENDING", 1, ?)',
                [userData.name, cpf, userData.unit, userData.email, userData.phone, titularAge, JSON.stringify(socialMapping)]);
            userId = result.insertId;
        } else {
            await pool.query('UPDATE users SET unit = ?, email = ?, phone = ?, age = ?, socialData = ? WHERE id = ?', 
                [userData.unit, userData.email, userData.phone, titularAge, JSON.stringify(socialMapping), userId]);
        }

        // SRE: Processamento de Dependentes (Repeater)
        // Busca perguntas do tipo repeater que contenham campos de data de nascimento
        for (const [qId, responseValue] of Object.entries(answers)) {
            if (Array.isArray(responseValue)) {
                // Para cada dependente no repeater
                for (const member of responseValue) {
                    // Tenta localizar um campo de nascimento (ex: dep_nasc)
                    const dobField = Object.keys(member).find(k => k.toLowerCase().includes('nasc') || k.toLowerCase().includes('birth'));
                    if (dobField && member[dobField]) {
                        member.age = calculateAge(member[dobField]);
                    }
                }
            }
        }

        await pool.query('INSERT INTO survey_responses (survey_id, user_id, cpf, user_name, answers) VALUES (?, ?, ?, ?, ?)',
            [surveyId, userId, cpf, userData.name, JSON.stringify(answers)]);

        await pool.query('INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "SUBMIT_CENSUS", "survey_responses", ?, ?)',
            [userId, surveyId, `Censo S.I.E PRO V9 Protocolado por ${userData.name}`]);

        res.json({ success: true, protocolId: Date.now() });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getResponses = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM survey_responses WHERE survey_id = ? ORDER BY created_at DESC', [req.params.id]);
        rows.forEach(r => { if (typeof r.answers === 'string') r.answers = JSON.parse(r.answers); });
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getResponsesByCpf = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC', [req.params.cpf]);
        rows.forEach(r => { if (typeof r.answers === 'string') r.answers = JSON.parse(r.answers); });
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const suggestQuestions = async (req, res) => {
    const { title, description, type } = req.body;
    try {
        const prompt = `Crie um conjunto de 5 perguntas avançadas para um formulário de ${type} intitulado "${title}". 
        Contexto: ${description}. FOCO: Assistência Social, Educação e Vulnerabilidade.
        REGRAS: 
        1. Use logic para branching (ex: se tem filhos, pergunta idade).
        2. Use repeater para multi-membros.
        Retorne um array JSON com objetos: id, text, type, options (se select), mapping_tag (EDUCATION, GOV_AID, etc), logic (objeto opcional), repeater_fields (array opcional).`;
        
        const responseText = await IAProviderManager.execute('suggest', {
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction: "Você é um arquiteto sênior de dados sociais especializado em governança pública."
            }
        });

        let cleanJson = responseText.replace(/```json|```/gi, '').trim();
        res.json({ data: JSON.parse(cleanJson) });
    } catch (e) {
        res.status(500).json({ error: "FALHA_PREDICT_IA: " + e.message });
    }
};
