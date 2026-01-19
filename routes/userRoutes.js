
import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';

const router = express.Router();
const generic = createHandlers('users');

// Apenas quem tem 'manage_users' pode listar, criar, editar ou excluir membros
router.get('/', authenticateToken, checkPermission('manage_users'), userController.getAllUsers);
router.post('/', authenticateToken, checkPermission('manage_users'), generic.create);
router.put('/:id', authenticateToken, checkPermission('manage_users'), generic.update);
router.delete('/:id', authenticateToken, checkPermission('manage_users'), generic.delete);

router.post('/:id/invite', authenticateToken, checkPermission('manage_users'), userController.generateInvite);
router.post('/:id/activate', authenticateToken, checkPermission('manage_users'), userController.activateUser);
router.get('/:id/dependents', authenticateToken, checkPermission('manage_users'), userController.getDependents);

export default router;
