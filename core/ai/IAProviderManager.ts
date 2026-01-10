
import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE V22.1)
 * Gerencia o pool de chaves API e a execução resiliente de tarefas de IA.
 * Implementa failover automático para erros de quota ou validade.
 */
export const IAProviderManager = {
  /**
   * Obtém a melhor chave disponível baseada em prioridade e status ativo.
   */
  async getActiveKey(): Promise<any> {
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM ai_keys WHERE status = "ACTIVE" ORDER BY priority ASC LIMIT 1'
      );
      return rows[0] || null;
    } catch (error) {
      console.error("[IA GATEWAY] CRITICAL: Erro ao consultar cluster de chaves:", error);
      return null;
    }
  },

  /**
   * Marca uma chave com erro e incrementa contador para auditoria.
   */
  async markKeyError(id: number | string, status: string = 'ERROR'): Promise<void> {
    try {
      await pool.query(
        'UPDATE ai_keys SET status = ?, error_count = error_count + 1, last_checked = NOW() WHERE id = ?',
        [status, id]
      );
    } catch (e) {
      console.error("[IA GATEWAY] Erro ao atualizar status da chave no DB.");
    }
  },

  /**
   * Normaliza o conteúdo para o formato exigido pela SDK (contents: [{ role, parts: [{ text | inlineData }] }])
   */
  normalizeContents(contents: any) {
    if (typeof contents === 'string') {
      return [{ role: 'user', parts: [{ text: contents }] }];
    }
    if (Array.isArray(contents)) {
      return contents.map(item => {
        if (item.parts) return item;
        return { role: item.role || 'user', parts: [{ text: item.text || item }] };
      });
    }
    if (contents.parts) {
      return [contents];
    }
    return [{ role: 'user', parts: [{ text: String(contents) }] }];
  },

  /**
   * Executor centralizado de tarefas de IA.
   * Suporta geração de texto, análise de imagem (OCR) e Thinking (Gemini 3).
   */
  async execute(task: 'generateText' | 'analyzeImage', payload: any): Promise<string> {
    const activeKey = await this.getActiveKey();
    
    // Fallback para variável de ambiente se o banco estiver vazio
    const apiKey = activeKey?.key_value || process.env.API_KEY;

    if (!apiKey) {
      throw new Error("SRE ALERT: Cluster de IA indisponível. Nenhuma chave operacional encontrada.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Seleção de modelo conforme diretrizes S.I.E PRO
      const modelName = payload.model || (
        activeKey?.tier === 'PAID' 
          ? 'gemini-3-pro-preview' 
          : 'gemini-3-flash-preview'
      );
      
      const normalizedContents = this.normalizeContents(payload.contents);
      
      const config: any = payload.config || {
        temperature: task === 'generateText' ? 0.7 : 0.4,
        topP: 0.95,
        topK: 40
      };

      // Se for Gemini 3 Pro e Paid, podemos habilitar thinking budget se solicitado
      if (modelName.includes('pro') && activeKey?.tier === 'PAID') {
        config.thinkingConfig = { thinkingBudget: payload.thinkingBudget || 0 };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: normalizedContents,
        config: config
      });

      const result = response.text;

      // Sucesso: Reseta contador de erros se for chave gerenciada pelo banco
      if (activeKey) {
        await pool.query(
          'UPDATE ai_keys SET last_checked = NOW(), error_count = 0 WHERE id = ?', 
          [activeKey.id]
        );
      }
      
      return result || "";

    } catch (error: any) {
      const errMsg = error.message?.toLowerCase() || "";
      console.error(`[IA GATEWAY] Falha na execução (${activeKey?.label || 'ENV_KEY'}):`, error.message);
      
      if (activeKey) {
        let newStatus = 'ERROR';
        if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('limit')) {
            newStatus = 'QUOTA_EXCEEDED';
        } else if (errMsg.includes('401') || errMsg.includes('invalid') || errMsg.includes('key not found')) {
            newStatus = 'INVALID';
        }
        
        await this.markKeyError(activeKey.id, newStatus);
        
        // Se a chave falhou, tentamos o próximo nó recursivamente
        console.warn(`[IA GATEWAY] Iniciando failover para o próximo nó do cluster...`);
        return this.execute(task, payload);
      }
      
      throw new Error(`SRE IA_FAILURE: ${error.message}`);
    }
  }
};
