
import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V25.5 - FINAL)
 * Cluster Neural Centralizado com suporte a Multimodalidade e Redundância.
 */
export const IAProviderManager = {

  async getActiveKey() {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM ai_keys WHERE status = "ACTIVE" AND key_value NOT LIKE "%EXEMPLO%" ORDER BY priority ASC LIMIT 1'
      );
      return rows[0] || null;
    } catch (error) {
      console.error("[IA GATEWAY] DB_SYNC_FAIL:", error.message);
      return null;
    }
  },

  async markKeyError(id, status = 'ERROR', message = '') {
    try {
      await pool.query(
        'UPDATE ai_keys SET status = ?, error_count = error_count + 1, last_checked = NOW() WHERE id = ?',
        [status, id]
      );
    } catch (e) {
      console.error("[IA GATEWAY] Telemetry Update Failed.");
    }
  },

  normalizeContents(contents) {
    if (!contents) return [{ role: 'user', parts: [{ text: "Comando nulo interceptado." }] }];
    if (typeof contents === 'string') return [{ role: 'user', parts: [{ text: contents }] }];
    if (contents.parts && !Array.isArray(contents)) return [contents];
    if (Array.isArray(contents)) {
      return contents.map(c => {
        if (typeof c === 'string') return { role: 'user', parts: [{ text: c }] };
        return c.parts ? c : { role: 'user', parts: [{ text: String(c) }] };
      });
    }
    return [{ role: 'user', parts: [{ text: String(contents) }] }];
  },

  async execute(task, payload) {
    const activeKeyFromDb = await this.getActiveKey();
    const apiKey = activeKeyFromDb?.key_value || process.env.API_KEY;

    if (!apiKey) throw new Error("IA_OFFLINE: Nenhuma chave operacional detectada.");

    // SRE COMPLIANCE: Must use named parameter exclusively
    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
      // SRE MODEL SELECTION
      let modelName = payload.model;
      if (!modelName) {
        if (task === 'analyzeImage' || (payload.contents && JSON.stringify(payload.contents).includes('inlineData'))) {
          modelName = 'gemini-2.5-flash-image';
        } else {
          modelName = activeKeyFromDb?.tier === 'PAID' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        }
      }

      const contents = this.normalizeContents(payload.contents);
      const systemInstruction = payload.config?.systemInstruction || "Você é o assistente oficial de governança do S.I.E PRO.";

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: payload.config?.temperature ?? 0.7,
          thinkingConfig: modelName.includes('pro') ? { thinkingBudget: 1024 } : undefined
        }
      });

      if (activeKeyFromDb) {
        await pool.query('UPDATE ai_keys SET last_checked = NOW(), error_count = 0 WHERE id = ?', [activeKeyFromDb.id]);
      }

      // SRE COMPLIANCE: Direct .text access (not text())
      return response.text || "";

    } catch (error) {
      if (activeKeyFromDb) await this.markKeyError(activeKeyFromDb.id, 'ERROR', error.message);
      throw error;
    }
  }
};
