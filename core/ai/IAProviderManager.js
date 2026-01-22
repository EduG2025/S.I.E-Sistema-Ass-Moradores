
import { GoogleGenAI } from "@google/genai";

/**
 * S.I.E IA Cluster Manager - Protocolo SRE v260.0 (STRICT 3.0 STANDARDS)
 * Orquestrador de Inteligência Grounded e Visão Computacional.
 */
export const IAProviderManager = {
  
  /**
   * Normaliza os conteúdos para o formato exigido pela SDK 3.0.
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
    // Suporte a multi-part (Imagens + Texto)
    if (contents.parts) return [contents];
    
    return [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }];
  },

  /**
   * Executa tarefas neurais com suporte a Grounding (Google Search/Maps).
   * Cria a instância da SDK apenas no momento da execução para garantir validade da API_KEY.
   */
  async execute(task, payload) {
    // SRE: Inicialização em tempo de execução conforme protocolo de segurança
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      // Priorizar gemini-3-flash-preview para velocidade e custo (Free Tier)
      let modelName = payload.model || 'gemini-3-flash-preview';
      let tools = payload.config?.tools || [];

      // Seleção automática de modelo baseada na ferramenta requerida
      if (tools.some(t => t.googleMaps)) {
          modelName = 'gemini-2.5-flash'; // Google Maps Grounding requer série 2.5
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: this.normalizeContents(payload.contents),
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o mentor de governança do S.I.E PRO.",
          temperature: payload.config?.temperature ?? 0.7,
          tools: tools,
          toolConfig: payload.config?.toolConfig,
          // Lógica de Thinking desabilitada por padrão para latência mínima no Advisor
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      // SRE FIX: Acesso direto à propriedade .text da SDK 3.0
      if (!response.text) {
          throw new Error("EMPTY_RESPONSE_FROM_KERNEL");
      }

      return {
          text: response.text,
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };

    } catch (error) {
        console.error(`[SRE AI ERROR] Protocol: ${task}`, error.message);
        
        if (error.message.includes("Requested entity was not found") || error.message.includes("API key not valid")) {
            throw new Error("NEURAL_LINK_INVALID: Verifique as configurações de API no Kernel.");
        }
        
        throw error;
    }
  }
};
