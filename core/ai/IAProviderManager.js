import { GoogleGenAI } from "@google/genai";

/**
 * S.I.E IA Cluster Manager - Protocolo SRE v228.0
 * Gerencia múltiplos nós neurais com failover automático.
 */
export const IAProviderManager = {
  
  // SRE FIX: API key must be obtained exclusively from environment variable process.env.API_KEY
  // Removed getEffectiveKey method as it used database lookups for API keys which is prohibited

  normalize(contents) {
    if (typeof contents === 'string') return contents;
    if (Array.isArray(contents)) return contents;
    if (contents.parts) return contents;
    return { parts: [{ text: JSON.stringify(contents) }] };
  },

  async execute(task, payload, retryCount = 0) {
    // SRE FIX: API key must be obtained exclusively from process.env.API_KEY per Gemini guidelines
    if (!process.env.API_KEY) {
        console.error("🛑 SRE CRITICAL: Nenhuma API_KEY disponível no Cluster.");
        throw new Error("CLUSTER_AI_OFFLINE");
    }

    try {
      // SRE FIX: Always use new GoogleGenAI({apiKey: process.env.API_KEY}); as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // SRE FIX: Default to 'gemini-3-flash-preview' for text and 'gemini-2.5-flash-image' for image tasks
      const modelName = task === 'ocr' ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: this.normalize(payload.contents),
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o advisor oficial do S.I.E PRO.",
          temperature: payload.config?.temperature ?? 0.7
        }
      });

      // SRE FIX: Use .text property directly (not a method) to extract response content
      const text = response.text;
      if (!text) throw new Error("Vácuo Neural detectado.");
      return text;

    } catch (error) {
        console.error(`[SRE AI CLUSTER FAIL - NODE ATTEMPT ${retryCount}]`, error.message);
        if (retryCount > 3) throw new Error("SRE AI Cluster: Exaustão de Nós.");
        // Se a falha for transitória, o retryCount forçará o sistema a tentar novamente
        return this.execute(task, payload, retryCount + 1);
    }
  }
};
