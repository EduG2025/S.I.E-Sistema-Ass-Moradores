
import express from 'express';
import * as resController from '../controllers/residentController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, resController.getDashboard);

export default router;
