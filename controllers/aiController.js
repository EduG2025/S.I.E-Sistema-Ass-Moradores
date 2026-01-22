import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import pool from '../config/database.js';

/**
 * ADVISOR CHAT (SRE MENTOR)
 */
export const chat = async (req, res) => {
    const { contents, useSearch, useMaps } = req.body;
    try {
        const tools = [];
        if (useSearch) tools.push({ googleSearch: {} });
        if (useMaps) tools.push({ googleMaps: {} });

        const result = await IAProviderManager.execute('chat', {
            contents: contents,
            config: {
                systemInstruction: "Você é o Advisor S.I.E PRO. Um especialista em leis brasileiras, gestão condominial e co-gestão. Use dados reais e seja estritamente técnico.",
                tools: tools
            }
        });
        
        res.json(result);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};

/**
 * ANALISTA DE RISCO (DOSSIÊ PREDITIVO)
 * Versão v700: Integração Profunda de Ledger Financeiro e Social.
 */
export const generateDossier = async (req, res) => {
    try {
        // 1. Coleta de Bio-dados
        const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
        if (!users.length) return res.status(404).json({ error: 'Membro não localizado no cluster.' });
        const user = users[0];

        // 2. Coleta de Ledger Financeiro (Últimos 24 meses)
        const [financials] = await pool.query(
            "SELECT description, amount, type, category, status, date FROM financials WHERE user_id = ? ORDER BY date DESC LIMIT 100", 
            [req.params.id]
        );

        // 3. Coleta de Histórico de Participação (Ouvidoria/Censo)
        const [censos] = await pool.query(
            "SELECT answers, created_at FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC LIMIT 1",
            [user.cpf_cnpj]
        );

        const context = {
            identidade: {
                nome: user.name,
                unidade: user.unit,
                idade: user.age,
                role: user.role,
                status: user.status
            },
            ledger_financeiro: financials,
            ledger_social: censos[0]?.answers || {},
            audit_meta: {
                tags: user.socialData?.tags || [],
                risk_score_prev: user.socialData?.risk || 0
            }
        };

        const result = await IAProviderManager.execute('dossier', {
            contents: `Realize uma ANÁLISE PREDITIVA DE GOVERNANÇA para o membro: ${JSON.stringify(context)}. 
            
            ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:
            1. PERFIL BIOGRÁFICO: Resumo do papel do membro no cluster.
            2. ANÁLISE DE SOLVÊNCIA: Baseada no histórico de pagamentos (adimplência vs inadimplência).
            3. ENGAJAMENTO SOCIAL: Análise das respostas de censo e participação.
            4. DIAGNÓSTICO DE RISCO (0-100%): Justifique o score baseado em evidências dos dados fornecidos.
            5. RECOMENDAÇÕES SRE: Ações preventivas para a administração.
            
            SEJA RIGOROSO E IMPARCIAL. RETORNE APENAS TEXTO FORMAL EM CAIXA ALTA PARA FACILITAR A LEITURA EM PROTOCOLOS OFICIAIS.`,
            config: {
                systemInstruction: "Você é o Neural Analyst Core da S.I.E PRO. Sua função é transformar dados brutos em inteligência preditiva de governança. Não invente dados; se o ledger estiver vazio, reporte 'DADOS INSUFICIENTES PARA CONCLUSÃO'."
            }
        });
        
        res.json({ text: result.text });
    } catch (e) { 
        res.status(500).json({ error: "DOSSIER_ENGINE_FAULT: " + e.message }); 
    }
};

/**
 * GHOSTWRITER JURÍDICO
 */
export const generateDocument = async (req, res) => {
    const { prompt } = req.body;
    try {
        const result = await IAProviderManager.execute('ghostwriter', {
            contents: prompt,
            config: {
                systemInstruction: "Ghostwriter SRE. Retorne apenas HTML semântico puro.",
            }
        });
        res.json({ text: result.text });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * VISION OCR GATEWAY
 */
export const ocr = async (req, res) => {
    const { image, context } = req.body;
    try {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const result = await IAProviderManager.execute('ocr', {
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: `Extraia JSON puro do contexto: ${context}` }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        res.json(JSON.parse(result.text));
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * TTS
 */
export const textToSpeech = async (req, res) => {
    const { text, voice } = req.body;
    try {
        const result = await IAProviderManager.execute('tts', { contents: text, voice: voice || 'Zephyr' });
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
};