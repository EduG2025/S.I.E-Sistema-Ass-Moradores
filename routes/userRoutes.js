import express from 'express';
import { body, param } from 'express-validator'; // Recomendado
import * as userController from '../controllers/userController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';
import { validate } from '../middlewares/validationMiddleware.js'; // Wrapper de validação

const router = express.Router();
const generic = createHandlers('users');

// =========================================================================
// 1. ROTAS ESTATÍCAS (Sempre no topo)
// =========================================================================

// Motor de busca neural (Feature específica antes de qualquer :id)
router.post('/search-neural', 
    authenticateToken, 
    checkPermission('view_demographics'),
    [
        body('query').isString(),
        body('filters').optional().isObject()
    ],
    validate,
    userController.searchNeural
);

// Rota para o próprio usuário se gerenciar (Self-Service)
// Importante: Não requer permissão 'manage_users', apenas estar logado.
router.get('/profile', authenticateToken, userController.getMyProfile);
router.put('/profile', authenticateToken, userController.updateMyProfile);

// =========================================================================
// 2. GESTÃO DE USUÁRIOS (Admin)
// =========================================================================

// Listagem Geral
router.get('/', authenticateToken, checkPermission('manage_users'), userController.getAllUsers);

// Criação
router.post('/', 
    authenticateToken, 
    checkPermission('manage_users'),
    [
        body('email').isEmail(),
        body('cpf').isLength({ min: 11 }),
        body('role').isIn(['RESIDENT', 'ADMIN', 'STAFF'])
    ],
    validate,
    userController.createUser
);

// =========================================================================
// 3. OPERAÇÕES EM UM USUÁRIO ESPECÍFICO (:id)
// =========================================================================

// Handlers de Identidade e Ações Específicas
// Devem vir antes de rotas genéricas que poderiam capturar URLs similares se mal configuradas
router.post('/:id/invite', authenticateToken, checkPermission('manage_users'), userController.generateInvite);
router.post('/:id/activate', authenticateToken, checkPermission('manage_users'), userController.activateUser);

// Gestão de Dependentes (Sub-recurso)
router.get('/:id/dependents', authenticateToken, checkPermission('manage_users'), userController.getDependents);

// --- CRUD Básico ---

// FALTAVA ESSA ROTA: Ler um usuário específico para edição
router.get('/:id', 
    authenticateToken, 
    checkPermission('manage_users'), 
    param('id').isUUID(), // Evita erros de banco se passar ID inválido
    validate,
    userController.getUserById || generic.getOne
);

// Atualização (Admin editando outro usuário)
router.put('/:id', 
    authenticateToken, 
    checkPermission('manage_users'), 
    validate,
    userController.updateMember
);

// Soft Delete é preferível, mas se usar Delete físico, proteja bem
router.delete('/:id', authenticateToken, checkPermission('manage_users'), generic.delete);

export default router;