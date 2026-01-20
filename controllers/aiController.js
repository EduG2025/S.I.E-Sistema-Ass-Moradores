
import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import pool from '../config/database.js';

export const chat = async (req, res) => {
    const { contents, useSearch, useMaps, location } = req.body;
    try {
        const tools = [];
        if (useSearch) tools.push({ googleSearch: {} });
        if (useMaps) tools.push({ googleMaps: {} });

        const config = {
            systemInstruction: "Você é o SRE Advisor. Use as ferramentas de busca para fornecer dados reais e atualizados sobre leis, serviços locais e clima organizacional.",
            tools: tools
        };

        if (useMaps && location) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: location.lat,
                        longitude: location.lng
                    }
                }
            };
        }

        const result = await IAProviderManager.execute('grounded_chat', {
            contents: contents,
            config: config
        });
        
        res.json(result);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};

export const generateDocument = async (req, res) => {
    const { prompt } = req.body;
    try {
        const result = await IAProviderManager.execute('ghostwriter', {
            contents: prompt,
            config: {
                systemInstruction: "Você é um Ghostwriter Jurídico Senior para o S.I.E PRO. Gere documentos em HTML estruturado.",
            }
        });
        res.json({ text: result.text });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};

export const ocr = async (req, res) => {
    const { image, context } = req.body;
    try {
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const contents = {
            parts: [
                { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                { text: `Extraia os dados estruturados desta imagem para o contexto ${context}. Retorne em JSON.` }
            ]
        };

        const result = await IAProviderManager.execute('ocr', {
            contents: contents,
            config: { responseMimeType: "application/json" }
        });
        
        let cleanJson = result.text.replace(/```json|```/gi, '').trim();
        res.json(JSON.parse(cleanJson));
    } catch (e) { 
        res.status(500).json({ error: "FALHA_OCR_NEURAL: " + e.message }); 
    }
};

export const generateDossier = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'USER_NOT_FOUND' });
        
        const result = await IAProviderManager.execute('dossier', {
            contents: `Analise este perfil demográfico e financeiro: ${JSON.stringify(rows[0])}. Gere um dossiê de risco.`,
        });
        res.json({ text: result.text });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};
