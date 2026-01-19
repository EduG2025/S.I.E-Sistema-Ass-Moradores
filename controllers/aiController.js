
import { IAProviderManager } from '../core/ai/IAProviderManager.js';
import pool from '../config/database.js';

export const chat = async (req, res) => {
    const { contents } = req.body;
    try {
        const textOutput = await IAProviderManager.execute('chat', {
            contents: contents,
            config: {
                systemInstruction: "Você é o SRE Advisor, especialista em Lei 4.591/64, Código Civil e normas ABNT aplicadas a condomínios e associações.",
            }
        });
        
        res.json({ text: textOutput });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};

export const generateDocument = async (req, res) => {
    const { prompt } = req.body;
    try {
        const textOutput = await IAProviderManager.execute('ghostwriter', {
            contents: prompt,
            config: {
                systemInstruction: "Você é um Ghostwriter Jurídico Senior para o S.I.E PRO. Gere documentos em HTML estruturado. REGRAS DE OURO: 1. Retorne APENAS o conteúdo HTML limpo. 2. OBRIGATÓRIO: Ao detectar que o conteúdo ultrapassa ~3000 caracteres ou muda de pauta/seção principal, insira <div class=\"page-break\"></div>. 3. Nunca deixe uma assinatura isolada em uma nova página; insira a quebra antes do último parágrafo de texto para manter o contexto. 4. Mantenha tom formal e jurídico. 5. Se solicitado para auditar, foque em encontrar erros de concordância e inconsistências de data/valores.",
            }
        });
        res.json({ text: textOutput });
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
                { text: `Extraia os dados estruturados desta imagem para o contexto ${context}. Retorne estritamente em JSON válido.` }
            ]
        };

        const responseText = await IAProviderManager.execute('ocr', {
            contents: contents,
            config: { responseMimeType: "application/json" }
        });
        
        // Limpeza de possíveis artefatos de markdown que a IA possa retornar apesar do mimeType
        let cleanJson = responseText.replace(/```json|```/gi, '').trim();
        res.json(JSON.parse(cleanJson));
    } catch (e) { 
        res.status(500).json({ error: "FALHA_OCR_NEURAL: " + e.message }); 
    }
};

export const generateDossier = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'USER_NOT_FOUND' });
        
        const textOutput = await IAProviderManager.execute('dossier', {
            contents: `Analise este perfil demográfico e financeiro: ${JSON.stringify(rows[0])}. Gere um dossiê de risco e potencial de participação comunitária.`,
        });
        res.json({ text: textOutput });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};
