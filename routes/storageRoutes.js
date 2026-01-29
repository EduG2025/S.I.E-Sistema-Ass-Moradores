import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Configuração do Multer (Armazenamento Local)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        // Cria a pasta se não existir
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Nome único: timestamp + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
    fileFilter: (req, file, cb) => {
        // Aceita imagens e textos
        if (file.mimetype.startsWith('image/') || file.mimetype === 'text/plain' || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado.'), false);
        }
    }
});

// ROTA: POST /api/storage/upload
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        // Gera a URL pública (ajuste o domínio conforme sua infra)
        // Ex: https://admcacaria.jennyai.space/uploads/nome-do-arquivo.jpg
        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.json({ 
            url: fileUrl, 
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: 'Falha interna no upload.' });
    }
});

export default router;