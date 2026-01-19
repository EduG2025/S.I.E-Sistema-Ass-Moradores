
import pool from '../config/database.js';

export const getStats = async (req, res) => {
    try {
        const [[income]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE type="INCOME" AND status="PAID"');
        const [[pending]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE status="PENDING"');
        const [[donations]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE category="DOAÇÃO"');
        const [[expense]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM financials WHERE type="EXPENSE"');
        
        const balance = parseFloat(income.total) - parseFloat(expense.total);

        res.json({
            balance: balance,
            income: parseFloat(income.total),
            pending: parseFloat(pending.total),
            donations: parseFloat(donations.total),
            expense: parseFloat(expense.total)
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getReports = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM audit_logs WHERE table_name="financials" ORDER BY created_at DESC LIMIT 50');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const logReportExport = async (req, res) => {
    try {
        await pool.query('INSERT INTO audit_logs (user_id, action, table_name, details) VALUES (?, "EXPORT", "financials", ?)', 
            [req.user.id, JSON.stringify(req.body)]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
