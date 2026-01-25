import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
};

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (page - 1) * limit;
        let query = "SELECT * FROM users";
        let params = [];
        
        if (search) {
            query += " WHERE name LIKE ? OR cpf_cnpj LIKE ? OR unit LIKE ? OR email LIKE ? OR phone LIKE ? OR profession LIKE ?";
            const s = `%${search}%`;
            params = [s, s, s, s, s, s];
        }
        
        query += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(query, params);
        
        // Count total for pagination
        let countQuery = "SELECT COUNT(*) as total FROM users";
        let countParams = [];
        if (search) {
            countQuery += " WHERE name LIKE ? OR cpf_cnpj LIKE ? OR unit LIKE ? OR email LIKE ? OR phone LIKE ? OR profession LIKE ?";
            const s = `%${search}%`;
            countParams = [s, s, s, s, s, s];
        }
        const [[{ total }]] = await pool.query(countQuery, countParams);

        res.json({ 
            data: rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createUser = async (req, res) => {
    try {
        const { password, ...userData } = req.body;
        const payload = { ...userData };
        
        if (password) payload.password_hash = await bcrypt.hash(password, 10);
        if (payload.birth_date) payload.age = calculateAge(payload.birth_date);
        
        ['socialData', 'coordinates'].forEach(key => {
            if (payload[key] && typeof payload[key] === 'object') {
                payload[key] = JSON.stringify(payload[key]);
            }
        });

        const [result] = await pool.query("INSERT INTO users SET ?", [payload]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateMember = async (req, res) => {
    try {
        const { id, created_at, updated_at, ...payload } = req.body;
        if (payload.birth_date) payload.age = calculateAge(payload.birth_date);
        
        ['socialData', 'coordinates'].forEach(key => {
            if (payload[key] && typeof payload[key] === 'object') {
                payload[key] = JSON.stringify(payload[key]);
            }
        });

        await pool.query("UPDATE users SET ? WHERE id = ?", [payload, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * SRE NEURAL SEARCH V2.0 - Localização Multicritério
 */
export const searchNeural = async (req, res) => {
    const { query } = req.body;
    if (!query) return res.json({ internal: [], focus_coordinate: null });

    try {
        const s = `%${query}%`;
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE (name LIKE ? OR cpf_cnpj LIKE ? OR unit LIKE ? OR email LIKE ? OR phone LIKE ? OR rg LIKE ?) AND active = 1 LIMIT 10", 
            [s, s, s, s, s, s]
        );
        
        let focusCoord = null;
        if (rows.length > 0) {
            // Tenta encontrar o primeiro registro que possua coordenadas válidas
            const firstWithCoords = rows.find(r => {
                if (!r.coordinates) return false;
                try {
                    const c = typeof r.coordinates === 'string' ? JSON.parse(r.coordinates) : r.coordinates;
                    return c.lat && c.lng;
                } catch(e) { return false; }
            });

            if (firstWithCoords) {
                const rawCoords = firstWithCoords.coordinates;
                focusCoord = typeof rawCoords === 'string' ? JSON.parse(rawCoords) : rawCoords;
            }
        }
        
        res.json({ 
            internal: rows, 
            focus_coordinate: focusCoord,
            mode: 'ACTIVE_SEARCH' 
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const generateInvite = async (req, res) => {
    try {
        const inviteLink = `/census/register?ref=${req.params.id}`;
        res.json({ success: true, link: inviteLink });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const activateUser = async (req, res) => {
    try {
        await pool.query("UPDATE users SET status = 'ACTIVE', active = 1 WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDependents = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM users WHERE parent_id = ?", [req.params.id]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};