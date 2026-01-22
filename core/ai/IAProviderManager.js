import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Cluster Manager - Protocolo SRE v400.0
 * Orquestrador de Inteligência com Soberania de Credenciais via DB.
 */
export const IAProviderManager = {
  
  /**
   * Normaliza os conteúdos para o formato exigido pela SDK.
   */
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
    if (contents && contents.parts) return [contents];
    return [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }];
  },

  /**
   * Executa tarefas neurais com soberania de credenciais.
   * Utiliza estritamente process.env.API_KEY conforme diretrizes de segurança.
   */
  async execute(task, payload) {
    // SRE CORE: Inicialização estrita com named parameter apiKey
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
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
          responseSchema: payload.config?.responseSchema
        }
      });

      // SRE SDK FIX: Acesso direto à propriedade .text (não é um método)
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