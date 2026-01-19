
import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.post('/chat', authenticateToken, aiController.chat);
router.post('/generate-document', authenticateToken, aiController.generateDocument);
router.post('/ocr', authenticateToken, aiController.ocr);
router.post('/dossier/:id', authenticateToken, requireAdmin, aiController.generateDossier);

export default router;
