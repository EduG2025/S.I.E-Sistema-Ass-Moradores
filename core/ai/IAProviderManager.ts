
import { GoogleGenAI } from "@google/genai";
import pool from "../../config/database.js";

/**
 * S.I.E IA Gateway Manager (Protocolo SRE)
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
    await pool.query(
      'UPDATE ai_keys SET status = ?, error_count = error_count + 1, last_checked = NOW() WHERE id = ?',
      [status, id]
    );
  },

  /**
   * Executor centralizado de tarefas de IA.
   * Suporta geração de texto e análise de imagem (OCR).
   */
  async execute(task: 'generateText' | 'analyzeImage', payload: any): Promise<string> {
    const activeKey = await this.getActiveKey();
    
    // Se não houver chave no DB, tenta usar a do ambiente como fallback emergencial
    const apiKey = activeKey?.key_value || process.env.API_KEY;

    if (!apiKey) {
      throw new Error("SRE ALERT: Cluster de IA indisponível. Nenhuma chave operacional encontrada.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Seleção de modelo conforme diretrizes
      const modelName = payload.model || (
        activeKey?.tier === 'PAID' 
          ? 'gemini-3-pro-preview' 
          : 'gemini-3-flash-preview'
      );
      
      let result = "";

      if (task === 'generateText') {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: payload.contents,
          config: payload.config || {
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });
        result = response.text;
      } else if (task === 'analyzeImage') {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: payload.contents
        });
        result = response.text;
      }

      // Sucesso: Reseta contador se for chave do banco
      if (activeKey) {
        await pool.query(
          'UPDATE ai_keys SET last_checked = NOW(), error_count = 0 WHERE id = ?', 
          [activeKey.id]
        );
      }
      
      return result || "";

    } catch (error: any) {
      console.error(`[IA GATEWAY] Falha na execução:`, error.message);
      
      if (activeKey) {
        let newStatus = 'ERROR';
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes('429') || errMsg.includes('quota')) newStatus = 'QUOTA_EXCEEDED';
        else if (errMsg.includes('api key not valid') || errMsg.includes('401')) newStatus = 'INVALID';
        
        await this.markKeyError(activeKey.id, newStatus);
        
        // Failover: Tenta a próxima chave se houver mais de uma
        console.warn(`[IA GATEWAY] Failover em curso...`);
        return this.execute(task, payload);
      }
      
      throw error;
    }
  }
};
