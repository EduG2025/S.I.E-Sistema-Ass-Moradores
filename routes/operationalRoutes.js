import express from 'express';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * 1. MAPEAMENTO DE MÓDULOS OPERACIONAIS (DRY ENGINE)
 * Separação de permissões entre VISUALIZAÇÃO e GESTÃO.
 */
const operationalModules = [
    { path: 'incidents', table: 'incidents', viewPerm: 'view_operations', managePerm: 'manage_operations' },
    { path: 'agenda', table: 'agenda', viewPerm: 'view_timeline', managePerm: 'manage_operations' },
    { path: 'projects', table: 'projects', viewPerm: 'view_projects', managePerm: 'manage_projects' },
    { path: 'assets', table: 'assets', viewPerm: 'view_operations', managePerm: 'manage_users' },
    { path: 'cameras', table: 'cameras', viewPerm: 'view_operations', managePerm: 'manage_settings' }
];

operationalModules.forEach(m => {
    const handlers = createHandlers(m.table);
    
    // Rotas de Leitura
    router.get(`/${m.path}`, authenticateToken, checkPermission(m.viewPerm), handlers.getAll);
    
    // Rotas de Escrita/Gestão (Mais restritas)
    router.post(`/${m.path}`, authenticateToken, checkPermission(m.managePerm || m.viewPerm), handlers.create);
    router.put(`/${m.path}/:id`, authenticateToken, checkPermission(m.managePerm || m.viewPerm), handlers.update);
    router.delete(`/${m.path}/:id`, authenticateToken, checkPermission(m.managePerm || m.viewPerm), handlers.delete);
});

/**
 * 2. MOTOR DE AGREGAÇÃO DE HEATMAP (SRE ANALYTICS)
 * Converte incidentes ativos em pontos de calor para o mapa.
 */
router.get('/incidents/heatmap', authenticateToken, checkPermission('view_operations'), async (req, res) => {
    try {
        // Seleção atômica de colunas para performance
        const [rows] = await pool.query(
            'SELECT coordinates, priority FROM incidents WHERE status != "RESOLVED" AND coordinates IS NOT NULL'
        );

        const heatData = rows.map(r => {
            let coords = r.coordinates;
            
            // Parser seguro de JSON
            try { 
                if (typeof coords === 'string') coords = JSON.parse(coords); 
            } catch(e) { return null; }
            
            if (!coords || !coords.lat || !coords.lng) return null;

            // Motor de Intensidade SIE PRO
            let intensity = 0.3;
            const p = String(r.priority || '').toUpperCase();
            if (p.includes('NÍVEL 4') || p.includes('CRÍTICO')) intensity = 1.0;
            else if (p.includes('NÍVEL 3') || p.includes('ALTO')) intensity = 0.7;
            else if (p.includes('NÍVEL 2') || p.includes('MÉDIO')) intensity = 0.5;

            return [parseFloat(coords.lat), parseFloat(coords.lng), intensity];
        }).filter(Boolean);

        res.json({ data: heatData, count: heatData.length });
    } catch (e) {
        console.error("[SRE HEATMAP FAIL]", e);
        res.status(500).json({ error: "Erro ao processar mapa de calor." });
    }
});

/**
 * 3. SUSTAINABILITY STATS (MOCK/BI)
 */
router.get('/sustainability/stats', authenticateToken, checkPermission('view_dashboard'), async (req, res) => {
    // Implementação futura: Buscar de uma tabela 'sustainability_logs'
    res.json({
        energy: [
            { date: '2025-01', value: 450, unit: 'kWh' }, 
            { date: '2025-02', value: 420, unit: 'kWh' }, 
            { date: '2025-03', value: 400, unit: 'kWh' }
        ],
        water: [
            { date: '2025-01', value: 120, unit: 'm³' }, 
            { date: '2025-02', value: 115, unit: 'm³' }, 
            { date: '2025-03', value: 95, unit: 'm³' }
        ],
        waste: [
            { name: 'Reciclável', value: 48, color: '#10b981' }, 
            { name: 'Orgânico', value: 32, color: '#f59e0b' }, 
            { name: 'Rejeito', value: 20, color: '#ef4444' }
        ],
        protocol: 'SRE_ECO_V1'
    });
});

/**
 * 4. MONITORING & PATROL CONFIG
 */
router.get('/monitoring/config', authenticateToken, checkPermission('view_operations'), async (req, res) => {
    try {
        const [[s]] = await pool.query('SELECT resident_ui_settings FROM settings WHERE id=1');
        const config = s?.resident_ui_settings ? 
            (typeof s.resident_ui_settings === 'string' ? JSON.parse(s.resident_ui_settings) : s.resident_ui_settings) 
            : { grid_size: 4, rotation_interval: 10, is_patrol_active: 0 };
            
        res.json(config);
    } catch (e) {
        res.status(500).json({ error: "Erro ao carregar configurações de monitoramento." });
    }
});

router.post('/monitoring/config', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        // Uso de JSON_MERGE_PATCH para atualização parcial segura
        await pool.query(
            'UPDATE settings SET resident_ui_settings = JSON_MERGE_PATCH(COALESCE(resident_ui_settings, "{}"), ?) WHERE id=1', 
            [JSON.stringify(req.body)]
        );
        res.json({ success: true, message: "Configurações de monitoramento atualizadas." });
    } catch (e) {
        res.status(500).json({ error: "Erro ao salvar configurações." });
    }
});

export default router;