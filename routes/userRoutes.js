import express from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';

const router = express.Router();
const generic = createHandlers('users');

// Gestão de Membros (Listagem e CRUD)
router.get('/', authenticateToken, checkPermission('manage_users'), userController.getAllUsers);
router.post('/', authenticateToken, checkPermission('manage_users'), userController.createUser);
router.put('/:id', authenticateToken, checkPermission('manage_users'), userController.updateMember);
router.delete('/:id', authenticateToken, checkPermission('manage_users'), generic.delete);

// Motor de busca neural georreferenciado
router.post('/search-neural', authenticateToken, checkPermission('view_demographics'), userController.searchNeural);

// Handlers de Identidade e Integração SRE (Correção de referências nulas)
router.post('/:id/invite', authenticateToken, checkPermission('manage_users'), userController.generateInvite);
router.post('/:id/activate', authenticateToken, checkPermission('manage_users'), userController.activateUser);
router.get('/:id/dependents', authenticateToken, checkPermission('manage_users'), userController.getDependents);

export default router;