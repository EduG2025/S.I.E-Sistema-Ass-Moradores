
import { GoogleGenAI } from "@google/genai";

/**
 * S.I.E IA Cluster Manager - Protocolo SRE v190.0 (STABILIZED)
 * Compliance total com as diretrizes da SDK Gemini 3.
 */
export const IAProviderManager = {
  
  /**
   * Normalização de conteúdos para o formato exigido pela SDK.
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
    if (contents.parts) return [contents];
    return [{ role: 'user', parts: [{ text: JSON.stringify(contents) }] }];
  },

  /**
   * Executa uma tarefa neural utilizando o modelo Gemini 3.
   * A API Key é obtida EXCLUSIVAMENTE de process.env.API_KEY.
   */
  async execute(task, payload) {
    // Inicialização mandatória via named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const modelName = payload.model || 'gemini-3-flash-preview';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: this.normalizeContents(payload.contents),
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o mentor de governança do S.I.E PRO.",
          temperature: payload.config?.temperature ?? 0.7,
          responseMimeType: payload.config?.responseMimeType || "text/plain"
        }
      });

      // Acesso direto à propriedade .text conforme diretrizes
      const textOutput = response.text;
      
      if (!textOutput) {
          throw new Error("Resposta neural vazia interceptada pelo Kernel.");
      }
      
      return textOutput;

    } catch (error) {
        console.error(`[SRE AI ERROR]`, error.message);
        if (error.message?.includes('API key not valid')) {
            throw new Error("SRE CRITICAL: API_KEY no .env é inválida ou expirou.");
        }
        throw error;
    }
  }
};
