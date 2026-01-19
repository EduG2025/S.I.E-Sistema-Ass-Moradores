
import express from 'express';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

const visitorHandlers = createHandlers('visitors');
const deliveryHandlers = createHandlers('deliveries');

// Portaria - Protegido por view_operations (Compartilhado com SRE Vision)
router.get('/visitors', authenticateToken, checkPermission('view_operations'), visitorHandlers.getAll);
router.post('/visitors', authenticateToken, checkPermission('view_operations'), visitorHandlers.create);
router.put('/visitors/:id', authenticateToken, checkPermission('view_operations'), visitorHandlers.update);
router.delete('/visitors/:id', authenticateToken, checkPermission('view_operations'), visitorHandlers.delete);

router.get('/deliveries', authenticateToken, checkPermission('view_operations'), deliveryHandlers.getAll);
router.post('/deliveries', authenticateToken, checkPermission('view_operations'), deliveryHandlers.create);
router.put('/deliveries/:id', authenticateToken, checkPermission('view_operations'), deliveryHandlers.update);
router.delete('/deliveries/:id', authenticateToken, checkPermission('view_operations'), deliveryHandlers.delete);

export default router;
