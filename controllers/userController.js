
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_production_master_2025';

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let q = "SELECT * FROM users";
        let params = [];
        
        if (search) {
            q += " WHERE name LIKE ? OR cpf_cnpj LIKE ? OR unit LIKE ?";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        q += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(q, params);
        
        // Sanitize JSON fields
        rows.forEach(r => {
            ['socialData', 'coordinates'].forEach(k => {
                if (r[k] && typeof r[k] === 'string') try { r[k] = JSON.parse(r[k]); } catch(e){}
            });
        });

        const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM users");
        
        res.json({ 
            data: rows,
            pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const generateInvite = async (req, res) => {
    try {
        const token = jwt.sign({ id: req.params.id, type: 'INVITE' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const activateUser = async (req, res) => {
    try {
        await pool.query('UPDATE users SET status="ACTIVE", active=1 WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDependents = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE parent_id = ?", [req.params.id]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
