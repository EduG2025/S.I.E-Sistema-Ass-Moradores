import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

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

// Sugestão: Adicionar prefixos para evitar conflitos de rota
router.use('/ops', operationalRoutes);
router.use('/concierge', conciergeRoutes);

// --- GLOBAL ANALYTICS & HEALTH ---

// Auditoria SRE
router.get('/audit', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, user_id, action, table_name, record_id, details, created_at FROM audit_logs ORDER BY id DESC LIMIT 100");
        res.json({ data: rows });
    } catch (e) { 
        console.error("Audit Fetch Fail:", e);
        res.status(500).json({ error: "Erro ao buscar trilha de auditoria." }); 
    }
});

// Health Check Otimizado
router.get('/system/health', async (req, res) => {
    try {
        const start = Date.now();
        await pool.query('SELECT 1'); // Teste rápido de latência do banco
        const dbLatency = Date.now() - start;

        res.json({
            status: 'OPERATIONAL',
            uptime: Math.floor(process.uptime()),
            db_latency: `${dbLatency}ms`,
            memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            kernel_version: '240.5'
        });
    } catch (e) { 
        res.status(503).json({ status: 'DEGRADED', error: "Database unreachable" }); 
    }
});

// BI Dashboard Stats (Consultas em Paralelo)
router.get('/demographics/stats', authenticateToken, checkPermission('view_demographics'), async (req, res) => {
    try {
        // Dispara todas as queries ao mesmo tempo
        const [totalRes, pendingRes, residentsRes] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM users'),
            pool.query('SELECT COUNT(*) as count FROM users WHERE status="PENDING"'),
            pool.query('SELECT COUNT(*) as count FROM users WHERE role="RESIDENT"')
        ]);

        res.json({
            totalPopulation: totalRes[0][0].count || 0,
            pending: pendingRes[0][0].count || 0,
            residents_count: residentsRes[0][0].count || 0,
            vulnerability: { low: 75, moderate: 15, critical: 10 }, // Pode ser calculado via query também
            protocol: 'SRE_ANALYTICS_V2'
        });
    } catch (e) { 
        console.error("Stats Fetch Fail:", e);
        res.status(500).json({ error: "Erro ao processar estatísticas." }); 
    }
});

export default router;