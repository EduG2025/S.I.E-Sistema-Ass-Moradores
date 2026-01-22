import express from 'express';
import * as commController from '../controllers/communicationController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();
const noticeHandlers = createHandlers('notices');

// Mural de Avisos
router.get('/notices', authenticateToken, noticeHandlers.getAll);
router.post('/notices', authenticateToken, checkPermission('manage_communication'), noticeHandlers.create);
router.put('/notices/:id', authenticateToken, checkPermission('manage_communication'), noticeHandlers.update);
router.delete('/notices/:id', authenticateToken, checkPermission('manage_communication'), noticeHandlers.delete);

// Templates (NOVO)
router.get('/templates', authenticateToken, checkPermission('manage_communication'), commController.getTemplates);
router.post('/templates', authenticateToken, checkPermission('manage_communication'), commController.saveTemplate);
router.delete('/templates/:id', authenticateToken, checkPermission('manage_communication'), commController.deleteTemplate);

// WhatsApp Bridge
router.post('/whatsapp-broadcast', authenticateToken, checkPermission('manage_communication'), commController.whatsappBroadcast);

// SRE Scheduler / Cron
router.get('/schedules', authenticateToken, checkPermission('manage_communication'), commController.getSchedules);
router.post('/schedules', authenticateToken, checkPermission('manage_communication'), commController.createSchedule);
router.delete('/schedules/:id', authenticateToken, checkPermission('manage_communication'), commController.deleteSchedule);

export default router;