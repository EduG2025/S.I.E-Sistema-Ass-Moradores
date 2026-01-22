import { GoogleGenAI } from "@google/genai";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V24.0)
 * Orquestrador de Inteligência com Soberania de Credenciais.
 */
export const IAProviderManager = {

  /**
   * Normaliza os conteúdos para o formato de mensagens exigido pela SDK.
   */
  normalizeContents(contents: any) {
    const sanitizePart = (p: any) => {
      if (typeof p === 'string') return { text: p };
      if (p.text) return { text: String(p.text) };
      if (p.inlineData) return p;
      return { text: "" };
    };

    if (typeof contents === 'string') {
      return [{ role: 'user', parts: [{ text: contents }] }];
    }

    if (Array.isArray(contents)) {
      return contents.map(msg => ({
        role: msg.role || 'user',
        parts: Array.isArray(msg.parts) ? msg.parts.map(sanitizePart) : [sanitizePart(msg)]
      }));
    }

    return [{ role: 'user', parts: [{ text: "Comando SRE vázio interceptado." }] }];
  },

  async execute(task: 'generateText' | 'analyzeImage' | string, payload: any): Promise<any> {
    // SRE CORE: Inicialização estrita conforme diretrizes do Gemini 3
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    try {
      const modelName = payload.model || 'gemini-3-flash-preview';
      const normalizedContents = this.normalizeContents(payload.contents);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: normalizedContents,
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o Kernel Mentor do S.I.E PRO (Sistema Inteligente Ativo).",
          temperature: payload.config?.temperature ?? 0.7,
          tools: payload.config?.tools || [],
          responseMimeType: payload.config?.responseMimeType,
          responseSchema: payload.config?.responseSchema
        }
      });

      // SRE FIX: Acesso direto à propriedade .text conforme nova SDK
      return {
          text: response.text || "",
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error: any) {
      console.error("[SRE IA CRITICAL ERROR]", error.message);
      throw error;
    }
  }
};
