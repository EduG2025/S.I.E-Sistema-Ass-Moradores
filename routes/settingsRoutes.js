import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';

const router = express.Router();

/**
 * SRE KERNEL UTILS
 * Funções auxiliares para tratamento de dados do banco
 */

// Parser de segurança para campos JSON vindos do MySQL
const parseSystemConfig = (settings) => {
    if (!settings) return {};
    const jsonFields = ['resident_ui_settings', 'whatsapp_config', 'coordinates', 'module_metadata'];
    
    jsonFields.forEach(field => {
        if (settings[field] && typeof settings[field] === 'string') {
            try { 
                settings[field] = JSON.parse(settings[field]); 
            } catch (e) { 
                settings[field] = {}; 
            }
        }
    });
    return settings;
};

/**
 * 1. GESTÃO DE CHAVES DE IA (AI KEYS)
 * Gerencia tokens de provedores (OpenAI, Anthropic, Gemini, etc)
 */
const aiKeysHandlers = createHandlers('ai_keys');

router.get('/ai-keys', 
    authenticateToken, 
    checkPermission('manage_ai_keys'), 
    aiKeysHandlers.getAll
);

router.post('/ai-keys', 
    authenticateToken, 
    checkPermission('manage_ai_keys'), 
    aiKeysHandlers.create
);

router.put('/ai-keys/:id', 
    authenticateToken, 
    checkPermission('manage_ai_keys'), 
    aiKeysHandlers.update
);

router.delete('/ai-keys/:id', 
    authenticateToken, 
    checkPermission('manage_ai_keys'), 
    aiKeysHandlers.delete
);

/**
 * 2. IDENTITY & ACCESS MANAGEMENT (RBAC)
 * Matriz de Cargos e Permissões do Cluster
 */

// Sincronização de permissões do usuário logado (Bypass para ADMIN)
router.get('/permissions/my', authenticateToken, async (req, res) => {
    try {
        if (req.user.virtual || req.user.role === 'ADMIN') {
            return res.json({ data: ['*'] });
        }
        const [rows] = await pool.query(
            'SELECT permission_id FROM role_permissions WHERE role = ?',
            [req.user.role]
        );
        res.json({ data: rows.map(r => r.permission_id) });
    } catch (e) { 
        res.status(500).json({ error: 'ERRO_SYNC_PERMISSOES' }); 
    }
});

// CRUD de Cargos (Roles)
router.get('/roles', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles ORDER BY label ASC');
        res.json({ data: rows });
    } catch (e) { 
        res.status(500).json({ error: 'ERRO_LISTA_CARGOS' }); 
    }
});

router.post('/roles', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { id, label } = req.body;
    if (!id || !label) return res.status(400).json({ error: 'DADOS_INCOMPLETOS' });
    try {
        await pool.query('INSERT INTO roles (id, label) VALUES (?, ?)', [id.toUpperCase(), label]);
        res.json({ success: true });
    } catch (e) { 
        res.status(500).json({ error: 'FALHA_AO_CRIAR_CARGO' }); 
    }
});

router.delete('/roles/:id', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const roleId = req.params.id.toUpperCase();
        const protectedRoles = ['ADMIN', 'RESIDENT', 'MORADOR', 'DIRETORIA'];
        
        if (protectedRoles.includes(roleId)) {
            return res.status(400).json({ error: 'CARGO_PROTEGIDO_PELO_SISTEMA' });
        }

        // Deleta o cargo e todas as permissões vinculadas a ele (Cascade manual)
        await pool.query('DELETE FROM roles WHERE id = ?', [roleId]);
        await pool.query('DELETE FROM role_permissions WHERE role = ?', [roleId]);
        
        res.json({ success: true });
    } catch (e) { 
        res.status(500).json({ error: 'FALHA_AO_DELETAR_CARGO' }); 
    }
});

// Matriz de Permissões (Matriz RBAC)
router.get('/permissions', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM role_permissions');
        res.json({ data: rows });
    } catch (e) { 
        res.status(500).json({ error: 'ERRO_MATRIZ_RBAC' }); 
    }
});

router.post('/permissions/toggle', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { role, permission_id, active } = req.body;
    try {
        if (active) {
            await pool.query('INSERT IGNORE INTO role_permissions (role, permission_id) VALUES (?, ?)', [role, permission_id]);
        } else {
            await pool.query('DELETE FROM role_permissions WHERE role = ? AND permission_id = ?', [role, permission_id]);
        }
        res.json({ success: true });
    } catch (e) { 
        res.status(500).json({ error: 'ERRO_NA_TRANSACAO_RBAC' }); 
    }
});

/**
 * 3. KERNEL SETTINGS (SISTEMA & CONFIGURAÇÕES GLOBAIS)
 * Configurações master do cluster, UI e integração WhatsApp.
 */

// Busca informações do sistema (Kernel Read)
router.get('/system', async (req, res) => {
    try {
        const [[s]] = await pool.query('SELECT * FROM settings WHERE id=1');
        if (!s) return res.status(404).json({ error: 'KERNEL_NOT_INITIALIZED' });
        
        res.json(parseSystemConfig(s));
    } catch (e) { 
        res.status(500).json({ error: 'FALHA_AO_LER_KERNEL' }); 
    }
});

// Atualiza informações do sistema (Kernel Write)
router.put('/system', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        // Whitelist de campos permitidos (Segurança contra Injeção de Colunas)
        const allowed = [
            'name', 'shortName', 'cnpj', 'address', 'email', 'phone', 'website', 
            'primaryColor', 'registrationMode', 'logoUrl', 'resident_ui_settings', 
            'whatsapp_config', 'module_metadata', 'president_name', 'president_cpf', 
            'management_start', 'management_end', 'president_signature', 'coordinates'
        ];
        
        const payload = {};
        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                // Se o campo for um objeto (JSON), stringifica para o banco. Se for null, mantém null.
                payload[field] = (typeof req.body[field] === 'object' && req.body[field] !== null) 
                    ? JSON.stringify(req.body[field]) 
                    : req.body[field];
            }
        });
        
        if (Object.keys(payload).length === 0) return res.json({ success: true });
        
        // Persistência Master
        await pool.query('UPDATE settings SET ? WHERE id=1', [payload]);
        
        // Registro de Auditoria SRE (Compliance e Rastreabilidade)
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "UPDATE_SYSTEM_INFO", "settings", 1, "Sincronização Master do Kernel e Configurações")', 
            [req.user?.id || 0]
        );
        
        res.json({ success: true });
    } catch (e) { 
        console.error("[SRE SETTINGS FAIL]", e.message);
        res.status(500).json({ error: 'FALHA_NA_ATUALIZACAO_DO_KERNEL' }); 
    }
});

export default router;