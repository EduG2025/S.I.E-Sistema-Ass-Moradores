
import pool from '../config/database.js';

export const getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const [notices] = await pool.query('SELECT * FROM notices ORDER BY created_at DESC LIMIT 5');
        const [reservations] = await pool.query('SELECT * FROM reservations WHERE user_id = ? AND date >= CURDATE()', [userId]);
        const [[balance]] = await pool.query('SELECT SUM(amount) as total FROM financials WHERE user_id = ? AND status="PENDING"', [userId]);
        
        res.json({
            recentNotices: notices,
            reservations: reservations,
            pendingBalance: balance.total || 0
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
