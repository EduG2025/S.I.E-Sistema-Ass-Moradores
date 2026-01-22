import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

/**
 * S.I.E GLOBAL DISCOVERY ENGINE (SRE V9.0)
 * Motor forense para localização de dados em todo o cluster (Ativo + Histórico).
 */
export const searchNeural = async (req, res) => {
    const { query } = req.body;
    try {
        const [[settings]] = await pool.query('SELECT shortName FROM settings WHERE id = 1');
        
        // 1. Parser Neural com Foco Forense
        const prompt = `
        Aja como Kernel Forense de Banco de Dados. Analise a entrada: "${query}".
        
        ESQUEMA PARA BUSCA GLOBAL:
        - 'users': [id, name, unit, cpf_cnpj, email]. (Dica: CPF é 'cpf_cnpj')
        - 'survey_responses': [id, user_id, cpf, user_name, answers]. (JSON 'answers')
        - 'incidents': [id, title, description, location].
        - 'audit_logs': [id, user_id, action, table_name, record_id, details]. (JSON 'details')
        - 'visitors': [id, name, document, unit]. (Documento pode ser CPF)

        OBJETIVO:
        Gere uma estratégia SQL para encontrar este termo em qualquer lugar.
        Se for número, remova a máscara (pontos/traços).
        Busque também o número formatado dentro de campos JSON/Details.

        RETORNE JSON:
        {
          "strategy": [
            { "table": "users", "where": "cpf_cnpj = ?", "params": ["VALOR_LIMPO"] },
            { "table": "audit_logs", "where": "details LIKE ?", "params": ["%VALOR_BUSCA%"] }
          ],
          "probable_entity": "USER | LOG | VISITOR | INCIDENT",
          "is_historical": boolean
        }
        `;

        let intent;
        try {
            const aiResponse = await IAProviderManager.execute('forensic_discovery', {
                model: IAProviderManager.MODELS.FAST,
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    systemInstruction: "Priorize encontrar o vínculo de unidade (unit/location). Limpe CPFs para busca em colunas indexadas, mas mantenha-os para busca em logs."
                }
            });
            intent = JSON.parse(aiResponse.text);
        } catch (e) {
            intent = { strategy: [{ table: "users", where: "cpf_cnpj LIKE ?", params: [`%${query.replace(/\D/g, '')}%`] }], probable_entity: "USER", is_historical: false };
        }

        // 2. Execução da Varredura Multi-Tabela
        let discoveryResults = [];
        for (const step of intent.strategy) {
            try {
                const [rows] = await pool.query(`SELECT * FROM ${step.table} WHERE ${step.where} LIMIT 10`, step.params);
                
                for (let row of rows) {
                    let entity = {
                        ...row,
                        origin_table: step.table,
                        entity_kind: intent.probable_entity,
                        is_historical: step.table === 'audit_logs',
                        label: row.name || row.title || row.user_name || `Registro #${row.id}`
                    };

                    // 3. Reconstrução de Vínculo de Endereço (Self-Healing Correlation)
                    if (!entity.unit) {
                        // Se for um LOG, tenta achar a unidade do dono do registro
                        if (step.table === 'audit_logs' && row.table_name === 'users') {
                            const [[u]] = await pool.query('SELECT unit FROM users WHERE id = ?', [row.record_id]);
                            entity.unit = u?.unit || 'UNID_DESCONHECIDA';
                        } 
                        // Se for um Censo, tenta unidade pelo user_id
                        else if (step.table === 'survey_responses' && row.user_id) {
                            const [[u]] = await pool.query('SELECT unit FROM users WHERE id = ?', [row.user_id]);
                            entity.unit = u?.unit || 'CENSO_EXTERNO';
                        }
                        // Fallback de localização em strings
                        else {
                            entity.unit = row.location || row.unit || '---';
                        }
                    }
                    
                    discoveryResults.push(entity);
                }
            } catch (err) { console.error(`[SRE SCAN FAIL] ${step.table}:`, err.message); }
        }

        res.json({ 
            internal: discoveryResults, 
            mode: discoveryResults.some(r => r.is_historical) ? 'FORENSIC_DEEP_SCAN' : 'ACTIVE_DISCOVERY',
            count: discoveryResults.length
        });

    } catch (e) {
        res.status(500).json({ error: "KERNEL_SCAN_PANIC: " + e.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (page - 1) * limit;
        const [rows] = await pool.query("SELECT id, name, cpf_cnpj, unit, role, status, email, avatar_url, active FROM users ORDER BY id DESC LIMIT ? OFFSET ?", [parseInt(limit), offset]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createUser = async (req, res) => {
    try {
        const [result] = await pool.query("INSERT INTO users SET ?", [req.body]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const activateUser = async (req, res) => {
    try {
        await pool.query('UPDATE users SET status="ACTIVE", active=1 WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDependents = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, name, role, unit FROM users WHERE parent_id = ?", [req.params.id]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const generateInvite = async (req, res) => {
    const [[survey]] = await pool.query('SELECT id FROM surveys WHERE status="ACTIVE" LIMIT 1');
    const link = survey ? `/census/${survey.id}?invite=${req.params.id}` : `/register?invite=${req.params.id}`;
    res.json({ success: true, link });
};