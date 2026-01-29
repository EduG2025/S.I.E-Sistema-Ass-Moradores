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
 * Versão v8.0: Suporte a Endereçamento Atômico e BI Social MySQL
 */
export const generateDossier = async (req, res) => {

    try {
        const [users] = await pool.query(
            "SELECT id, name, cpf_cnpj, unit, age, role, status, cep, street, number, complement, neighborhood, city, state, socialData FROM users WHERE id = ?",
            [req.params.id]
        );

        if (!users.length) return res.status(404).json({ error: 'Membro não localizado no cluster.' });
        const user = users[0];

        const [financials] = await pool.query(
            "SELECT description, amount, type, category, status, date FROM financials WHERE user_id = ? ORDER BY date DESC LIMIT 50",
            [req.params.id]
        );

        const [censos] = await pool.query(
            "SELECT answers, created_at FROM survey_responses WHERE cpf = ? ORDER BY created_at DESC LIMIT 1",
            [user.cpf_cnpj]
        );

        const context = {
            membro: {
                identidade: {
                    nome: user.name,
                    papel: user.role,
                    estado: user.status,
                    idade: user.age
                },
                localizacao: {
                    unidade: user.unit,
                    cep: user.cep,
                    logradouro: user.street,
                    numero: user.number,
                    bairro: user.neighborhood,
                    cidade_uf: `${user.city}/${user.state}`
                }
            },
            ledger_financeiro: financials,
            censo_social: censos[0]?.answers || user.socialData || {},
            historico_social: user.socialData || {}
        };


        const result = await IAProviderManager.execute('dossier', {
            contents: `Gere um DOSSIÊ TÁTICO DE GOVERNANÇA para o membro baseado nos dados: ${JSON.stringify(context)}. 
            
            DIRETRIZES SRE:
            - Calcule o SCORE DE RISCO (0-100) baseado em inadimplência e vulnerabilidade habitacional.
            - Analise o ENGAJAMENTO do membro (se respondeu ao censo ou possui ouvidorias).
            - Formate o texto em CAIXA ALTA com tópicos claros para leitura em tablets de monitoramento.
            - Caso o endereço esteja incompleto, sugira o protocolo de atualização cadastral.`,
            config: {
                systemInstruction: "Analista Neural S.I.E PRO. Foco em precisão administrativa e compliance LGPD."
            }
        });

        res.json({ text: result.text });
    } catch (e) {
        console.error("[SRE DOSSIER FAIL]", e.message);
        res.status(500).json({ error: "AI_GENERATION_FAULT" });
    }
};

/**
 * GHOSTWRITER JURÍDICO (DOCUMENT HUB)
 * Versão v213.0: Suporte Completo a RAG (Contexto e Regimento)
 */
export const generateDocument = async (req, res) => {
    // ✅ ADICIONADO: Extração do context do body
    const { prompt, context } = req.body;

    try {
        // ✅ ADICIONADO: Construção do Prompt Enriquecido (RAG)
        let enrichedPrompt = `
        ATUE COMO: Um especialista jurídico e administrativo experiente (Secretário Geral).
        OBJETIVO: Redigir um documento oficial ou texto formal solicitado abaixo.
        TOM DE VOZ: Formal, Respeitoso, Institucional, Juridicamente Seguro.
        
        INSTRUÇÕES DE FORMATAÇÃO (RIGOROSO):
        - Retorne APENAS o conteúdo do documento em HTML semântico limpo.
        - Use tags: <p>, <b>, <i>, <br>, <ul>, <li>, <table>.
        - NÃO USE Markdown (nada de **negrito** ou ### Titulo). USE HTML.
        - Se o usuário pedir um Ofício, siga a estrutura padrão (Cabeçalho, Destinatário, Corpo, Fechamento).
        `;

        if (context) {
            enrichedPrompt += `
            
            === CONTEXTO E REGRAS DA ORGANIZAÇÃO (RAG) ===
            O documento deve respeitar estritamente as seguintes informações e regras:
            ${context}
            === FIM DO CONTEXTO ===
            `;
        }

        enrichedPrompt += `
        
        === SOLICITAÇÃO DO USUÁRIO ===
        ${prompt}
        `;

        const result = await IAProviderManager.execute('ghostwriter', {
            contents: enrichedPrompt, // Envia o prompt enriquecido
            config: {
                systemInstruction: "Ghostwriter SRE. Você é um assistente de redação jurídica. Sua saída deve ser HTML puro pronto para ser injetado em um editor WYSIWYG. Não inclua ```html no início.",
            }
        });

        // Limpeza de segurança (caso a IA coloque blocos de código)
        const cleanText = result.text.replace(/```html/g, '').replace(/```/g, '').trim();

        res.json({ text: cleanText });
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