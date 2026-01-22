import { GoogleGenAI, Modality } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Cluster Manager - Protocolo SRE v705.0
 * Orquestrador de Soberania Neural com Failover Agressivo.
 */
export const IAProviderManager = {
  
  MODELS: {
    FAST: 'gemini-3-flash-preview',           
    INTELLIGENT: 'gemini-3-pro-preview',     
    GROUNDING: 'gemini-2.5-flash',           
    TTS: 'gemini-2.5-flash-preview-tts'      
  },

  async getAvailableKeys() {
    try {
        const [rows] = await pool.query(
            "SELECT id, key_value, model, tier FROM ai_keys WHERE status = 'ACTIVE' AND error_count < 10 ORDER BY priority DESC, tier DESC, error_count ASC"
        );
        return rows.map(r => ({ id: r.id, val: r.key_value, preferred: r.model, tier: r.tier }));
    } catch (e) {
        console.error("[SRE IA DB ERROR]", e.message);
        return [];
    }
  },

  sanitizeOutput(text) {
    if (!text) return "";
    return text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  },

  normalizeContents(contents) {
    if (typeof contents === 'string') return [{ role: 'user', parts: [{ text: contents }] }];
    if (Array.isArray(contents)) return contents.map(c => typeof c === 'string' ? { role: 'user', parts: [{ text: c }] } : c);
    if (contents?.parts) return [contents];
    return [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }];
  },

  /**
   * Execução Neural com Protocolo de Exaustão de Pool.
   */
  async execute(task, payload) {
    const keysPool = await this.getAvailableKeys();
    
    if (keysPool.length === 0 && process.env.API_KEY) {
        keysPool.push({ id: 0, val: process.env.API_KEY, preferred: this.MODELS.FAST, tier: 'FREE' });
    }

    if (keysPool.length === 0) throw new Error("SRE_CRITICAL: Cluster neural sem tokens ativos.");

    let lastError = null;

    // Loop de failover agressivo: Tenta cada chave do pool
    for (const keyObj of keysPool) {
        try {
            const ai = new GoogleGenAI({ apiKey: keyObj.val });
            
            let modelName = payload.model || keyObj.preferred || this.MODELS.FAST;
            if (task === 'dossier' || task === 'ghostwriter') {
                modelName = this.MODELS.INTELLIGENT;
            }

            const tools = payload.config?.tools || [];
            if (tools.some(t => t.googleSearch || t.googleMaps)) {
                modelName = this.MODELS.GROUNDING;
            }

            if (task === 'tts') {
                modelName = this.MODELS.TTS;
                const ttsResponse = await ai.models.generateContent({
                    model: modelName,
                    contents: this.normalizeContents(payload.contents),
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: payload.voice || 'Zephyr' } } }
                    }
                });
                return { audio: ttsResponse.candidates?.[0]?.content?.parts[0]?.inlineData.data };
            }

            const response = await ai.models.generateContent({
                model: modelName,
                contents: this.normalizeContents(payload.contents),
                config: {
                    systemInstruction: payload.config?.systemInstruction || "Você é o Mentor SRE do S.I.E PRO.",
                    temperature: payload.config?.temperature ?? 0.7,
                    tools: tools,
                    responseMimeType: payload.config?.responseMimeType,
                    responseSchema: payload.config?.responseSchema
                }
            });

            if (!response.text) throw new Error("EMPTY_NEURAL_FRAME");

            if (keyObj.id !== 0) {
                await pool.query("UPDATE ai_keys SET error_count = 0, last_checked = NOW() WHERE id = ?", [keyObj.id]);
            }

            return {
                text: this.sanitizeOutput(response.text),
                groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
            };

        } catch (error) {
            // SRE LOG: Captura o erro detalhado da SDK
            const errorMsg = error.message || JSON.stringify(error);
            console.error(`[SRE FAILOVER ACTIVE] Falha na Chave ID ${keyObj.id}: ${errorMsg}`);
            
            lastError = error;
            if (keyObj.id !== 0) {
                await pool.query("UPDATE ai_keys SET error_count = error_count + 1, last_checked = NOW() WHERE id = ?", [keyObj.id]);
            }
            
            // Continua para a próxima chave sem interromper o processo
            continue;
        }
    }

    // Se chegou aqui, todas as chaves falharam
    throw new Error(`SRE_CLUSTER_EXHAUSTED: ${lastError?.message || 'Erro Desconhecido'}`);
  }
};