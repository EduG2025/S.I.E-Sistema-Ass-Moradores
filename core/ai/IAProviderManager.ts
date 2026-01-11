import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V22.9.1)
 * Executor blindado contra INVALID_ARGUMENT e problemas de extensão.
 */
export const IAProviderManager = {

  async getActiveKey(): Promise<any> {
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM ai_keys WHERE status = "ACTIVE" ORDER BY priority ASC LIMIT 1'
      );
      return rows[0] || null;
    } catch (error) {
      console.error("[IA GATEWAY] CRITICAL: Falha ao consultar chaves:", error);
      return null;
    }
  },

  async markKeyError(id: number | string, status: string = 'ERROR'): Promise<void> {
    try {
      await pool.query(
        'UPDATE ai_keys SET status = ?, error_count = error_count + 1, last_checked = NOW() WHERE id = ?',
        [status, id]
      );
    } catch {
      console.error("[IA GATEWAY] Erro ao atualizar status da chave.");
    }
  },

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

    if (contents && contents.parts) {
      return [{
        role: contents.role || 'user',
        parts: Array.isArray(contents.parts) ? contents.parts.map(sanitizePart) : [sanitizePart(contents.parts)]
      }];
    }

    return [{ role: 'user', parts: [{ text: "Comando SRE vázio interceptado." }] }];
  },

  async execute(task: 'generateText' | 'analyzeImage', payload: any): Promise<string> {
    const activeKey = await this.getActiveKey();
    const apiKey = activeKey?.key_value || process.env.API_KEY;

    if (!apiKey) throw new Error("SRE ALERT: Cluster de IA indisponível.");

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const modelName = payload.model || (activeKey?.tier === 'PAID' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview');
      const normalizedContents = this.normalizeContents(payload.contents);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: normalizedContents,
        config: {
          systemInstruction: payload.config?.systemInstruction || "Você é o assistente oficial do S.I.E PRO.",
          temperature: payload.config?.temperature ?? 0.7
        }
      });

      if (activeKey) {
        await pool.query('UPDATE ai_keys SET last_checked = NOW(), error_count = 0 WHERE id = ?', [activeKey.id]);
      }

      return response.text || "";
    } catch (error: any) {
      if (activeKey) await this.markKeyError(activeKey.id);
      throw error;
    }
  }
};