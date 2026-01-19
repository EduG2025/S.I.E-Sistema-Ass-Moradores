
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin, checkPermission } from '../middlewares/auth.js';

// Domain Routers
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import aiRoutes from './aiRoutes.js';
import governanceRoutes from './governanceRoutes.js';
import communityRoutes from './communityRoutes.js';
import financeRoutes from './financeRoutes.js';
import surveyRoutes from './surveyRoutes.js';
import operationalRoutes from './operationalRoutes.js';
import conciergeRoutes from './conciergeRoutes.js';
import residentRoutes from './residentRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = express.Router();

// --- SERVICE MESH REGISTRATION ---
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
router.use('/governance', governanceRoutes);
router.use('/community', communityRoutes);
router.use('/financials', financeRoutes);
router.use('/surveys', surveyRoutes);
router.use('/resident', residentRoutes);
router.use('/communication', communicationRoutes);
router.use('/settings', settingsRoutes);
router.use('/', operationalRoutes);
router.use('/', conciergeRoutes);   

// --- GLOBAL ANALYTICS & HEALTH ---
router.get('/audit', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/system/health', async (req, res) => {
    try {
        const [[{count}]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE active=1');
        res.json({ status: 'OPERATIONAL', uptime: Math.floor(process.uptime()), cpu_load: '0.05', db_status: '200_OK', population: count });
    } catch (e) { res.json({ status: 'DEGRADED', error: e.message }); }
});

router.get('/demographics/stats', authenticateToken, checkPermission('view_demographics'), async (req, res) => {
    try {
        const [[total]] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [[pending]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status="PENDING"');
        res.json({ 
            totalPopulation: total.total || 0, 
            pending: pending.count || 0,
            incomeDistribution: { low: 45, midLow: 30, mid: 15, high: 10 },
            vulnerability: { low: 70, moderate: 20, critical: 10 }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
