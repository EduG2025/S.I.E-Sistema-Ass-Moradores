import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V25.5 - FINAL)
 * Cluster Neural Centralizado com suporte a Multimodalidade, 
 * Redundância de Chaves e Auditoria de Falhas.
 */
export const IAProviderManager = {

  async getActiveKey() {
    try {
      // SRE SHIELD: Busca chaves ATIVAS, ignorando placeholders de exemplo.
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
      console.warn(`[IA GATEWAY] Nó ${id} rebaixado para ${status}: ${message}`);
    } catch (e) {
      console.error("[IA GATEWAY] Telemetry Update Failed.");
    }
  },

  /**
   * Normaliza os conteúdos para o padrão estrito do SDK @google/genai (1.34+).
   */
  normalizeContents(contents) {
    if (!contents) return [{ role: 'user', parts: [{ text: "Comando nulo interceptado pelo SRE." }] }];

    // Turno Único (String)
    if (typeof contents === 'string') {
      return [{ role: 'user', parts: [{ text: contents }] }];
    }

    // Multimodal (OCR / Imagens) - Já vem estruturado do endpoint /ocr
    if (contents.parts && !Array.isArray(contents)) {
      return [contents];
    }

    // Histórico de Chat (Array)
    if (Array.isArray(contents)) {
      return contents.map(c => {
        if (typeof c === 'string') return { role: 'user', parts: [{ text: c }] };
        if (c.parts) return c;
        return { role: 'user', parts: [{ text: String(c) }] };
      });
    }

    return [{ role: 'user', parts: [{ text: String(contents) }] }];
  },

  /**
   * Ponto de entrada universal para o Cluster de Inteligência.
   * @param task 'generateText' | 'analyzeImage' | 'chat'
   * @param payload { contents, model, config }
   */
  async execute(task, payload) {
    const activeKeyFromDb = await this.getActiveKey();
    const apiKey = activeKeyFromDb?.key_value || process.env.API_KEY;

    if (!apiKey || apiKey.includes("EXEMPLO")) {
      throw new Error("IA_OFFLINE: Cluster indisponível. Nenhuma chave operacional detectada.");
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      // Seleção de Modelo
      let modelName = payload.model;
      if (!modelName) {
        if (task === 'analyzeImage' || (payload.contents?.parts?.some(p => p.inlineData))) {
          modelName = 'gemini-2.5-flash-image';
        } else {
          modelName = activeKeyFromDb?.tier === 'PAID' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        }
      }

      const contents = this.normalizeContents(payload.contents);

      const config = {
        systemInstruction: payload.config?.systemInstruction || "Você é o assistente técnico de governança do S.I.E PRO. Auxilie na gestão de condomínios com precisão técnica.",
        temperature: payload.config?.temperature ?? 0.7,
        topP: payload.config?.topP ?? 0.95,
        responseMimeType: payload.config?.responseMimeType || "text/plain",
      };

      // Injeção de Raciocínio (Apenas Modelos Pro)
      if (modelName.includes('pro')) {
        config.thinkingConfig = { thinkingBudget: payload.config?.thinkingBudget || 2048 };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config
      });

      const output = response.text;
      if (!output) throw new Error("NULL_PAYLOAD: Resposta neural vazia.");

      // Auditoria de Sucesso
      if (activeKeyFromDb) {
        await pool.query('UPDATE ai_keys SET last_checked = NOW(), error_count = 0 WHERE id = ?', [activeKeyFromDb.id]);
      }

      return output;

    } catch (error) {
      const errorMsg = error.message || "Unknown Provider Error";
      console.error(`[IA PROVIDER ERROR] (${task}):`, errorMsg);

      if (activeKeyFromDb) {
        const isAuthError = errorMsg.includes("API key not valid") || errorMsg.includes("INVALID_ARGUMENT") || errorMsg.includes("403");
        await this.markKeyError(activeKeyFromDb.id, isAuthError ? 'INVALID' : 'ERROR', errorMsg);

        // FALLBACK: Se houver uma chave secundária no ENV, tenta ela como última alternativa
        if (process.env.API_KEY && process.env.API_KEY !== activeKeyFromDb.key_value) {
          console.info("[IA GATEWAY] Tentando Fallback SRE via ENV Key...");
          const fallbackPayload = { ...payload, model: 'gemini-3-flash-preview' };
          return await this.execute(task, fallbackPayload);
        }
      }

      throw new Error(`AI_CLUSTER_FAIL: ${errorMsg}`);
    }
  }
};