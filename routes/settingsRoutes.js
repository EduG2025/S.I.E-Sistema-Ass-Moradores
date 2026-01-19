
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';

const router = express.Router();
const aiKeysHandlers = createHandlers('ai_keys');

// AI Keys CRUD
router.get('/ai-keys', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.getAll);
router.post('/ai-keys', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.create);
router.put('/ai-keys/:id', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.update);
router.delete('/ai-keys/:id', authenticateToken, checkPermission('manage_ai_keys'), aiKeysHandlers.delete);

// Dynamic Permissions (Self)
router.get('/permissions/my', authenticateToken, async (req, res) => {
    try {
        if (req.user.virtual || req.user.role === 'ADMIN') {
            return res.json({ data: ['*'] });
        }
        const [rows] = await pool.query(
            'SELECT permission_id FROM role_permissions WHERE role = ?',
            [req.user.role]
        );
        res.json({ data: rows.map(r => r.permission_id) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Dynamic Roles CRUD - Protegido por manage_settings
router.get('/roles', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM roles ORDER BY label ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/roles', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { id, label } = req.body;
    try {
        await pool.query('INSERT INTO roles (id, label) VALUES (?, ?)', [id.toUpperCase(), label]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_CRIAR_CARGO' }); }
});

router.put('/roles/:id', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { label } = req.body;
    try {
        await pool.query('UPDATE roles SET label = ? WHERE id = ?', [label, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_EDITAR_CARGO' }); }
});

router.delete('/roles/:id', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        if (['ADMIN', 'RESIDENT'].includes(req.params.id)) {
            return res.status(400).json({ error: 'PROTECTED_ROLE' });
        }
        await pool.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
        await pool.query('DELETE FROM role_permissions WHERE role = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_DELETAR_CARGO' }); }
});

// RBAC Permissions Matrix - Protegido por manage_settings
router.get('/permissions', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM role_permissions');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/permissions/toggle', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    const { role, permission_id, active } = req.body;
    try {
        if (active) {
            await pool.query('INSERT IGNORE INTO role_permissions (role, permission_id) VALUES (?, ?)', [role, permission_id]);
        } else {
            await pool.query('DELETE FROM role_permissions WHERE role = ? AND permission_id = ?', [role, permission_id]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// System Info
router.get('/system', async (req, res) => {
    try {
        const [[s]] = await pool.query('SELECT * FROM settings WHERE id=1');
        if (s) {
            if (s.resident_ui_settings && typeof s.resident_ui_settings === 'string') s.resident_ui_settings = JSON.parse(s.resident_ui_settings);
            if (s.whatsapp_config && typeof s.whatsapp_config === 'string') s.whatsapp_config = JSON.parse(s.whatsapp_config);
        }
        res.json(s || {});
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/system', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const allowed = ['name', 'shortName', 'cnpj', 'address', 'email', 'phone', 'website', 'primaryColor', 'registrationMode', 'logoUrl', 'resident_ui_settings', 'whatsapp_config'];
        const payload = {};
        allowed.forEach(f => {
            if (req.body[f] !== undefined) {
                payload[f] = (typeof req.body[f] === 'object' && req.body[f] !== null) ? JSON.stringify(req.body[f]) : req.body[f];
            }
        });
        if (Object.keys(payload).length === 0) return res.json({ success: true });
        await pool.query('UPDATE settings SET ? WHERE id=1', [payload]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
