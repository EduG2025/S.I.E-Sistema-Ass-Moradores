
import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V25.9 - REFORÇADO)
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

  // SRE: Normalizador Universal de Payload para o Gemini SDK
  normalizeContents(contents) {
    if (!contents) return "Comando vazio.";
    
    // Se for string, converte para o formato de mensagem esperado
    if (typeof contents === 'string') {
      return contents;
    }

    // Se for um array de mensagens (histórico)
    if (Array.isArray(contents)) {
      const lastMsg = contents[contents.length - 1];
      if (typeof lastMsg === 'string') return lastMsg;
      if (lastMsg.parts) {
          const part = Array.isArray(lastMsg.parts) ? lastMsg.parts[0] : lastMsg.parts;
          return part.text || "Conteúdo não identificado.";
      }
    }

    // Se for um objeto com partes
    if (contents.parts) {
        const part = Array.isArray(contents.parts) ? contents.parts[0] : contents.parts;
        if (part.text) return part.text;
    }

    return String(contents);
  },

  async execute(task, payload) {
    const activeKeyFromDb = await this.getActiveKey();
    const apiKey = activeKeyFromDb?.key_value || process.env.API_KEY;

    if (!apiKey) throw new Error("IA_OFFLINE: Nenhuma chave operacional detectada no cluster.");

    const ai = new GoogleGenAI({ apiKey: apiKey });

    try {
      let modelName = payload.model;
      if (!modelName) {
        if (task === 'analyzeImage' || (payload.contents && JSON.stringify(payload.contents).includes('inlineData'))) {
          modelName = 'gemini-2.5-flash-image';
        } else {
          modelName = activeKeyFromDb?.tier === 'PAID' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        }
      }

      const promptText = this.normalizeContents(payload.contents);
      const systemInstruction = payload.config?.systemInstruction || "Você é o assistente oficial de governança do S.I.E PRO.";

      // SRE: Chamada unificada conforme diretriz oficial
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptText, // SRE FIX: Envia como texto plano se for normalizado
        config: {
          systemInstruction,
          temperature: payload.config?.temperature ?? 0.7
        }
      });

      if (activeKeyFromDb) {
        await pool.query('UPDATE ai_keys SET last_checked = NOW(), error_count = 0 WHERE id = ?', [activeKeyFromDb.id]);
      }

      return response.text || "O Kernel não pôde processar a resposta neural.";

    } catch (error) {
      console.error("[IA GATEWAY] EXECUTION_FAIL:", error.message);
      if (activeKeyFromDb) await this.markKeyError(activeKeyFromDb.id, 'ERROR', error.message);
      throw error;
    }
  }
};
