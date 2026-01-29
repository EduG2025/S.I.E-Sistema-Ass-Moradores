import express from 'express';
import * as govController from '../controllers/governanceController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';
import pool from '../config/database.js'; // Importado para busca rápida de categorias

const router = express.Router();

/**
 * MOTOR GENÉRICO: AI Prompts
 * Gerencia a tabela 'ai_prompts' (Instruções da IA)
 */
const promptHandlers = createHandlers('ai_prompts');

// --- 1. ASSEMBLEIAS (DECISÕES COLETIVAS) ---

router.get('/assemblies', 
    authenticateToken, 
    govController.getAssemblies
); 

router.post('/assemblies', 
    authenticateToken, 
    checkPermission('manage_assemblies'), 
    govController.createAssembly
);

router.put('/assemblies/:id', 
    authenticateToken, 
    checkPermission('manage_assemblies'), 
    govController.updateAssembly
);

router.delete('/assemblies/:id', 
    authenticateToken, 
    checkPermission('manage_assemblies'), 
    govController.deleteAssembly
);

// --- 2. DOCUMENTOS E ESTATUTOS ---

router.get('/documents', 
    authenticateToken, 
    checkPermission('view_documents'), 
    govController.getDocuments
);

router.post('/documents', 
    authenticateToken, 
    checkPermission('manage_documents'), 
    govController.saveDocument
);

router.put('/documents/:id', 
    authenticateToken, 
    checkPermission('manage_documents'), 
    govController.saveDocument
);

router.delete('/documents/:id', 
    authenticateToken, 
    checkPermission('manage_documents'), 
    govController.deleteDocument
);

// --- 3. GESTÃO DE PROMPTS & INTELIGÊNCIA ---

// Listar categorias de prompts (para preencher selects no frontend)
router.get('/prompts/categories', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, name FROM prompt_categories ORDER BY name ASC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Listar todos os prompts salvos
router.get('/prompts', 
    authenticateToken, 
    promptHandlers.getAll
);

// Criar/Salvar Prompt (Acesso restrito a quem gere o Kernel/Settings)
router.post('/prompts', 
    authenticateToken, 
    checkPermission('manage_settings'), 
    promptHandlers.create
);

// Atualizar Prompt
router.put('/prompts/:id', 
    authenticateToken, 
    checkPermission('manage_settings'), 
    promptHandlers.update
);

// Excluir Prompt
router.delete('/prompts/:id', 
    authenticateToken, 
    checkPermission('manage_settings'), 
    promptHandlers.delete
);

export default router;