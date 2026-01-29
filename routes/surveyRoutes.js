import express from 'express';
import * as surveyController from '../controllers/surveyController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();
const generic = createHandlers('surveys');

// Admin CRUD - Protegido por permissão granular manage_surveys
router.get('/', authenticateToken, checkPermission('manage_surveys'), surveyController.getAllSurveys);
router.post('/', authenticateToken, checkPermission('manage_surveys'), generic.create);
router.put('/:id', authenticateToken, checkPermission('manage_surveys'), generic.update);
router.delete('/:id', authenticateToken, checkPermission('manage_surveys'), generic.delete);

// Auditoria de Respostas
router.get('/responses/all', authenticateToken, checkPermission('manage_surveys'), surveyController.getAllSurveyResponses);
router.get('/:id/responses', authenticateToken, checkPermission('manage_surveys'), surveyController.getResponses);
router.get('/responses/cpf/:cpf', authenticateToken, checkPermission('manage_surveys'), surveyController.getResponsesByCpf);

// IA Question Suggestion
router.post('/suggest', authenticateToken, checkPermission('manage_surveys'), surveyController.suggestQuestions);

// Public Handshake (No Auth Required)
// SRE FIX: Rotas específicas DEVEM vir antes de rotas parametrizadas como :id
router.get('/public/check-resident/:cpf', surveyController.checkResident);
router.get('/public/:id', surveyController.getPublicSurvey);
router.post('/public/:surveyId/submit', surveyController.submitResponse);

export default router;