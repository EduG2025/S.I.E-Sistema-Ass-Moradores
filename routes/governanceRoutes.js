
import express from 'express';
import * as govController from '../controllers/governanceController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';

const router = express.Router();
const promptHandlers = createHandlers('prompt_templates');

// Assembleias
router.get('/assemblies', authenticateToken, govController.getAssemblies); 
router.post('/assemblies', authenticateToken, checkPermission('manage_assemblies'), govController.createAssembly);
router.put('/assemblies/:id', authenticateToken, checkPermission('manage_assemblies'), govController.updateAssembly);
router.delete('/assemblies/:id', authenticateToken, checkPermission('manage_assemblies'), govController.deleteAssembly);

// Documentos
router.get('/documents', authenticateToken, checkPermission('view_documents'), govController.getDocuments);
router.post('/documents', authenticateToken, checkPermission('view_documents'), govController.saveDocument);
router.put('/documents/:id', authenticateToken, checkPermission('view_documents'), govController.saveDocument);
router.delete('/documents/:id', authenticateToken, checkPermission('view_documents'), govController.deleteDocument);

// Prompts Templates
router.get('/prompts', authenticateToken, promptHandlers.getAll);
router.post('/prompts', authenticateToken, promptHandlers.create);
router.delete('/prompts/:id', authenticateToken, promptHandlers.delete);

export default router;
