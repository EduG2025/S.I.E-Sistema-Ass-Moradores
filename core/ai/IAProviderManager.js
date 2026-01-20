
import { GoogleGenAI, Type } from "@google/genai";

/**
 * S.I.E IA Cluster Manager - Protocolo SRE v260.0 (STRICT INITIALIZATION)
 */
export const IAProviderManager = {
  
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
    return [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }];
  },

  /**
   * Executa tarefas neurais com suporte a Grounding.
   * Cria a instância da SDK apenas no momento da execução para garantir validade da API_KEY.
   */
  async execute(task, payload) {
    // SRE: Criação da instância estritamente conforme diretrizes
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      let modelName = payload.model || 'gemini-3-flash-preview';
      let tools = payload.config?.tools || [];

      // Seleção automática de modelo baseada na ferramenta
      if (tools.some(t => t.googleMaps)) {
          modelName = 'gemini-2.5-flash';
      } else if (tools.some(t => t.googleSearch)) {
          modelName = 'gemini-3-flash-preview';
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: this.normalizeContents(payload.contents),
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o mentor de governança do S.I.E PRO.",
          temperature: payload.config?.temperature ?? 0.7,
          tools: tools,
          toolConfig: payload.config?.toolConfig
        }
      });

      if (!response.text) {
          throw new Error("EMPTY_RESPONSE_FROM_KERNEL");
      }

      return {
          text: response.text,
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };

    } catch (error) {
        console.error(`[SRE AI ERROR]`, error.message);
        // Tratamento específico para entidade não encontrada ou chave inválida
        if (error.message.includes("Requested entity was not found") || error.message.includes("API key not valid")) {
            throw new Error("NEURAL_LINK_INVALID: Verifique a API_KEY nas configurações.");
        }
        throw error;
    }
  }
};
