import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken, requireAdmin } from '../middlewares/auth.js';
import pool from '../config/database.js'; // Acesso direto ao DB para as rotas CRUD de prompts

const router = express.Router();

// --- 1. ROTAS DE PROCESSAMENTO DE IA (CONTROLLER) ---
router.post('/chat', authenticateToken, aiController.chat);
router.post('/generate-document', authenticateToken, aiController.generateDocument);
router.post('/ocr', authenticateToken, aiController.ocr);
router.post('/dossier/:id', authenticateToken, requireAdmin, aiController.generateDossier);
router.post('/tts', authenticateToken, aiController.textToSpeech); // Adicionado caso precise do TTS mencionado anteriormente

// --- 2. ROTAS DE GESTÃO DE PROMPTS (CRUD BANCO DE DADOS) ---

// LISTAR (GET)
router.get('/prompts', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ai_prompts ORDER BY is_favorite DESC, title ASC');
        res.json({ data: rows });
    } catch (error) {
        console.error('Erro ao listar prompts:', error.message);
        // Retorna array vazio se a tabela não existir, evitando crash no front
        res.json({ data: [] });
    }
});

// CRIAR (POST)
router.post('/prompts', authenticateToken, async (req, res) => {
    const { title, content, category, is_favorite } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO ai_prompts (title, content, category, is_favorite) VALUES (?, ?, ?, ?)',
            [title, content, category || 'GERAL', is_favorite ? 1 : 0]
        );

        const newPrompt = {
            id: result.insertId,
            title,
            content,
            category: category || 'GERAL',
            is_favorite: !!is_favorite,
            created_at: new Date()
        };

        res.status(201).json({ data: newPrompt, message: 'Prompt salvo com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar prompt:', error);
        res.status(500).json({ error: 'Erro ao salvar no banco de dados.' });
    }
});

// ATUALIZAR (PUT) - ADICIONADO
router.put('/prompts/:id', authenticateToken, async (req, res) => {
    const { title, content, category, is_favorite } = req.body;
    try {
        await pool.query(
            'UPDATE ai_prompts SET title = ?, content = ?, category = ?, is_favorite = ? WHERE id = ?',
            [title, content, category, is_favorite, req.params.id]
        );
        res.json({ message: 'Prompt atualizado.' });
    } catch (error) {
        console.error('Erro ao atualizar prompt:', error);
        res.status(500).json({ error: 'Erro ao atualizar prompt.' });
    }
});

// EXCLUIR (DELETE)
router.delete('/prompts/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM ai_prompts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Prompt excluído.' });
    } catch (error) {
        console.error('Erro ao excluir prompt:', error);
        res.status(500).json({ error: 'Erro ao excluir prompt.' });
    }
});

export default router;