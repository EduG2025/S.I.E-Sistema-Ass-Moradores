import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V23.0)
 * Executor dinâmico utilizando a chave mestre do ambiente.
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

  async execute(task: 'generateText' | 'analyzeImage' | string, payload: any): Promise<string> {
    // SRE FIX: Always use process.env.API_KEY directly for initialization as per Google GenAI guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const modelName = payload.model || 'gemini-3-flash-preview';
      const normalizedContents = this.normalizeContents(payload.contents);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: normalizedContents,
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o assistente oficial do S.I.E PRO.",
          temperature: payload.config?.temperature ?? 0.7
        }
      });

      // SRE FIX: Accessing .text property directly from GenerateContentResponse
      return response.text || "";
    } catch (error: any) {
      console.error("[SRE IA TS ERROR]", error);
      throw error;
    }
  }
};