
import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Cluster Manager - Protocolo SRE v400.0
 * Orquestrador de Inteligência com Soberania de Credenciais via DB.
 */
export const IAProviderManager = {
  
  /**
   * Obtém a chave de API e modelo ativo do banco de dados.
   * Prioriza chaves com status 'ACTIVE' e maior prioridade.
   */
  async getActiveCredentials() {
    try {
      const [rows] = await pool.query(
        "SELECT key_value, provider, label FROM ai_keys WHERE status = 'ACTIVE' ORDER BY priority DESC LIMIT 1"
      );
      
      if (rows.length > 0) {
        return { 
          apiKey: rows[0].key_value, 
          provider: rows[0].provider,
          label: rows[0].label
        };
      }
      
      // Fallback para process.env apenas se o DB estiver vazio (Modo Emergência)
      if (process.env.API_KEY) {
        console.warn("[SRE WARN] Nenhuma chave no DB. Usando Master Key do Ambiente.");
        return { apiKey: process.env.API_KEY, provider: 'GOOGLE', label: 'MASTER_ENV' };
      }
      
      throw new Error("SRE_IA_AUTH_CRITICAL: Nenhuma credencial de IA localizada no Kernel.");
    } catch (e) {
      console.error("[SRE IA AUTH FAIL]", e.message);
      throw e;
    }
  },

  normalizeContents(contents) {
    if (typeof contents === 'string') {
        return [{ role: 'user', parts: [{ text: contents }] }];
    }
    if (Array.isArray(contents)) {
        return contents.map(c => {
            if (typeof c === 'string') return { role: 'user', parts: [{ text: c }] };
            return c;
        });
    }
    if (contents.parts) return [contents];
    return [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }];
  },

  /**
   * Executa tarefas neurais com soberania de credenciais e seleção de modelo.
   */
  async execute(task, payload) {
    // SRE FIX: Guidelines require using process.env.API_KEY directly for initializing the GoogleGenAI instance.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      // O modelo também pode ser dinâmico vindo da config do usuário futuramente
      let modelName = payload.model || 'gemini-3-flash-preview';
      let tools = payload.config?.tools || [];

      // Google Maps grounding exige série 2.5
      if (tools.some(t => t.googleMaps)) {
          modelName = 'gemini-2.5-flash';
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: this.normalizeContents(payload.contents),
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o Kernel Mentor do S.I.E PRO (Sistema Inteligente Ativo).",
          temperature: payload.config?.temperature ?? 0.5,
          tools: tools,
          toolConfig: payload.config?.toolConfig,
          responseMimeType: payload.config?.responseMimeType,
          responseSchema: payload.config?.responseSchema,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      // SRE FIX: Accessing .text property instead of calling it as a function.
      if (!response.text) {
          throw new Error("EMPTY_AI_RESPONSE");
      }

      return {
          text: response.text,
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };

    } catch (error) {
        console.error(`[SRE AI ERROR] Task: ${task}`, error.message);
        throw error;
    }
  }
};
