import express from 'express';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Mapeamento de tabelas para permissões operacionais
const operationalModules = [
    { path: 'incidents', table: 'incidents', perm: 'view_operations' },
    { path: 'agenda', table: 'agenda', perm: 'view_timeline' },
    { path: 'projects', table: 'projects', perm: 'view_projects' },
    { path: 'assets', table: 'assets', perm: 'manage_users' }, // Ativos costumam ser admin
    { path: 'cameras', table: 'cameras', perm: 'view_operations' }
];

operationalModules.forEach(m => {
    const handlers = createHandlers(m.table);
    router.get(`/${m.path}`, authenticateToken, checkPermission(m.perm), handlers.getAll);
    router.post(`/${m.path}`, authenticateToken, checkPermission(m.perm), handlers.create);
    router.put(`/${m.path}/:id`, authenticateToken, checkPermission(m.perm), handlers.update);
    router.delete(`/${m.path}/:id`, authenticateToken, checkPermission(m.perm), handlers.delete);
});

// SRE: Motor de agregação de Heatmap
router.get('/incidents/heatmap', authenticateToken, checkPermission('view_operations'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT coordinates, priority FROM incidents WHERE status != "RESOLVED"');
        const heatData = rows.map(r => {
            if (!r.coordinates) return null;
            let coords = r.coordinates;
            try { if (typeof coords === 'string') coords = JSON.parse(coords); } catch(e){}
            
            // Intensidade baseada na prioridade
            let intensity = 0.3;
            if (r.priority.includes('NÍVEL 4')) intensity = 1.0;
            else if (r.priority.includes('NÍVEL 3')) intensity = 0.7;
            else if (r.priority.includes('NÍVEL 2')) intensity = 0.5;

            return [coords.lat, coords.lng, intensity];
        }).filter(Boolean);

        res.json({ data: heatData });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Sustainability Stats - Geral para membros ativos ou restrito a dashboard?
router.get('/sustainability/stats', authenticateToken, checkPermission('view_dashboard'), async (req, res) => {
    res.json({
        energy: [{ date: '2025-01', value: 450 }, { date: '2025-02', value: 420 }, { date: '2025-03', value: 400 }],
        water: [{ date: '2025-01', value: 120 }, { date: '2025-02', value: 115 }, { date: '2025-03', value: 95 }],
        waste: [{ name: 'Reciclável', value: 48, color: '#10b981' }, { name: 'Orgânico', value: 32, color: '#f59e0b' }, { name: 'Rejeito', value: 20, color: '#ef4444' }]
    });
});

// Monitoring Config
router.get('/monitoring/config', authenticateToken, checkPermission('view_operations'), async (req, res) => {
    const [[s]] = await pool.query('SELECT resident_ui_settings FROM settings WHERE id=1');
    res.json(s || { grid_size: 4, rotation_interval: 10, is_patrol_active: 0 });
});

router.post('/monitoring/config', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    await pool.query('UPDATE settings SET resident_ui_settings = JSON_MERGE_PATCH(resident_ui_settings, ?) WHERE id=1', [JSON.stringify(req.body)]);
    res.json({ success: true });
});

export default router;