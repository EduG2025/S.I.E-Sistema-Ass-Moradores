
import express from 'express';
import * as finController from '../controllers/financeController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();
const generic = createHandlers('financials');

// Visualização restrita a quem tem 'view_finances'
router.get('/', authenticateToken, checkPermission('view_finances'), generic.getAll);
router.get('/stats', authenticateToken, checkPermission('view_finances'), finController.getStats);

// Gestão (CUD) restrita a quem tem 'view_finances' (ou poderíamos ter manage_finances)
router.post('/', authenticateToken, checkPermission('view_finances'), generic.create);
router.put('/:id', authenticateToken, checkPermission('view_finances'), generic.update);
router.delete('/:id', authenticateToken, checkPermission('view_finances'), generic.delete);

// Auditoria requer permissão de configurações/compliance
router.get('/reports', authenticateToken, checkPermission('manage_settings'), finController.getReports);
router.post('/reports/log', authenticateToken, checkPermission('manage_settings'), finController.logReportExport);

export default router;
