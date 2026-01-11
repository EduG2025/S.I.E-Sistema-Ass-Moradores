import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V22.10.5 - FINAL)
 * Centralizador de chamadas Gemini com suporte a Multimodalidade (Texto + Imagem),
 * balanceamento de carga e tolerância a falhas de missão crítica.
 */
export const IAProviderManager = {

  async getActiveKey() {
    try {
      // SRE SHIELD: Busca apenas chaves ATIVAS que não sejam placeholders de exemplo.
      // A ordenação por prioridade permite o uso de chaves 'PAID' (Tier alto) primeiro.
      const [rows] = await pool.query(
        'SELECT * FROM ai_keys WHERE status = "ACTIVE" AND key_value NOT LIKE "%EXEMPLO%" ORDER BY priority ASC LIMIT 1'
      );
      return rows[0] || null;
    } catch (error) {
      console.error("[IA GATEWAY] CRITICAL DB ERROR:", error.message);
      return null;
    }
  },

  async markKeyError(id, status = 'ERROR', message = '') {
    try {
      await pool.query(
        'UPDATE ai_keys SET status = ?, error_count = error_count + 1, last_checked = NOW() WHERE id = ?',
        [status, id]
      );
      console.warn(`[IA GATEWAY] Nó ${id} marcado como ${status}: ${message}`);
    } catch {
      console.error("[IA GATEWAY] Falha ao atualizar telemetria da chave.");
    }
  },

  /**
   * Normaliza os conteúdos para o formato estrito exigido pelo SDK @google/genai.
   * Suporta: String, Array de Mensagens (Chat) e Objetos Multimodais (Partes com imagem).
   */
  normalizeContents(contents) {
    if (!contents) return [{ role: 'user', parts: [{ text: "Comando vazio interceptado." }] }];

    // Caso 1: String simples (Conversão direta para turno único)
    if (typeof contents === 'string') {
      return [{ role: 'user', parts: [{ text: contents }] }];
    }

    // Caso 2: Objeto com parts (Multimodal - usado para imagens/OCR)
    if (contents.parts && !Array.isArray(contents)) {
      return [contents];
    }

    // Caso 3: Array de turnos (Histórico de chat)
    if (Array.isArray(contents)) {
      return contents.map(c => {
        if (typeof c === 'string') return { role: 'user', parts: [{ text: c }] };
        return c;
      });
    }

    return [{ role: 'user', parts: [{ text: String(contents) }] }];
  },

  /**
   * Ponto de entrada universal para o cluster de IA.
   * @param task 'generateText' | 'analyzeImage' | 'chat'
   * @param payload { contents, model, config }
   */
  async execute(task, payload) {
    const activeKeyFromDb = await this.getActiveKey();

    // Prioriza chave dinâmica (Banco) com fallback para chave estática (Variável de Ambiente VPS)
    const apiKey = activeKeyFromDb?.key_value || process.env.API_KEY;

    if (!apiKey || apiKey.includes("EXEMPLO")) {
      throw new Error("SRE ALERT: Cluster de IA indisponível. Nenhuma chave operacional configurada no Kernel.");
    }

    // Instanciação isolada para garantir independência de threads e chaves
    const ai = new GoogleGenAI({ apiKey });

    try {
      // Seleção Inteligente de Modelo baseada na tarefa e no Tier da chave
      let modelName = payload.model;
      
      if (!modelName) {
        if (task === 'analyzeImage') {
          // Tarefas de visão exigem maior precisão
          modelName = 'gemini-3-pro-image-preview'; 
        } else {
          // Balanceamento: Pro para chaves pagas, Flash para chaves Free
          modelName = activeKeyFromDb?.tier === 'PAID' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
        }
      }

      const contents = this.normalizeContents(payload.contents);

      // Protocolo de Configuração de Geração SRE
      const config = {
        systemInstruction: payload.config?.systemInstruction || "Você é o assistente técnico de governança do S.I.E PRO. Auxilie moradores e administradores com foco em ética, conformidade legal e eficiência operacional.",
        temperature: payload.config?.temperature ?? 0.7,
        topP: payload.config?.topP ?? 0.95,
        topK: payload.config?.topK ?? 64,
        responseMimeType: payload.config?.responseMimeType || "text/plain",
      };

      // Injeção de Thinking Budget para raciocínio complexo (apenas em modelos Pro não-visuais)
      if (modelName.includes('pro') && !modelName.includes('image')) {
        config.thinkingConfig = { thinkingBudget: payload.config?.thinkingBudget || 2048 };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config
      });

      // Extração de saída via propriedade .text (SDK 1.34+)
      const outputText = response.text;

      // Telemetria de Sucesso e Reset de Contador de Erros
      if (activeKeyFromDb) {
        await pool.query('UPDATE ai_keys SET last_checked = NOW(), error_count = 0 WHERE id = ?', [activeKeyFromDb.id]);
      }

      return outputText;

    } catch (error) {
      const errorMsg = error.message || "Unknown Provider Error";
      console.error(`[IA GATEWAY] PROVIDER FAILURE (${task}):`, errorMsg);

      if (activeKeyFromDb) {
        await this.markKeyError(activeKeyFromDb.id, 'ERROR', errorMsg);

        // LOGICA DE RECURSIVIDADE DE EMERGÊNCIA:
        // Se a chave do banco falhou mas temos uma chave de ambiente diferente, tenta o fallback imediato.
        if (process.env.API_KEY && process.env.API_KEY !== activeKeyFromDb.key_value) {
          console.info("[IA GATEWAY] Executando Rota de Fuga SRE via Fallback ENV...");
          const fallbackPayload = { ...payload };
          // Força o modelo Flash para garantir maior taxa de sucesso no fallback
          fallbackPayload.model = 'gemini-3-flash-preview';
          return await this.execute(task, fallbackPayload);
        }
      }

      throw new Error(`AI_CLUSTER_CRITICAL_FAILURE: ${errorMsg}`);
    }
  }
};