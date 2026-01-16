import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * IA Provider Manager - Protocolo SRE v180.8
 * Cluster de inteligência com failover automático e suporte a Gemini 3.
 */
export const IAProviderManager = {
  stats: { totalRequests: 0, failedRequests: 0 },

  async getClusterKey() {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM ai_keys WHERE status = "ACTIVE" AND error_count < 5 ORDER BY priority ASC LIMIT 1'
      );
      return rows[0] || null;
    } catch (e) { return null; }
  },

  async reportStatus(id, error) {
    if (!id) return;
    try {
      if (!error) {
        await pool.query('UPDATE ai_keys SET error_count = 0, last_checked = NOW() WHERE id = ?', [id]);
        return;
      }
      this.stats.failedRequests++;
      await pool.query('UPDATE ai_keys SET error_count = error_count + 1, last_checked = NOW() WHERE id = ?', [id]);
    } catch (e) {}
  },

  normalize(contents) {
    if (typeof contents === 'string') return contents;
    if (contents.parts) return contents;
    if (Array.isArray(contents)) return { parts: contents.map(c => typeof c === 'string' ? { text: c } : c) };
    return { parts: [{ text: JSON.stringify(contents) }] };
  },

  async execute(task, payload, retryCount = 0) {
    if (retryCount > 2) throw new Error("Cluster IA exausto ou offline após múltiplas tentativas.");
    
    this.stats.totalRequests++;
    // SRE FIX: API key must be obtained exclusively from process.env.API_KEY per Gemini guidelines
    if (!process.env.API_KEY) throw new Error("Cluster S.I.E sem chaves de inteligência configuradas.");

    try {
      // SRE FIX: Direct initialization with process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = task === 'ocr' ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: this.normalize(payload.contents),
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o assistente oficial do S.I.E PRO (Sistema Inteligente Ativo). Forneça respostas precisas e executivas.",
          temperature: payload.config?.temperature ?? 0.7
        }
      });

      // SDK v3: .text é uma propriedade, não um método
      const text = response.text;
      if (!text) throw new Error("IA retornou buffer vazio ou inválido.");
      
      return text;

    } catch (error) {
      console.error(`[SRE AI FAIL - TENTATIVA ${retryCount}]`, error.message);
      return this.execute(task, payload, retryCount + 1);
    }
  }
};