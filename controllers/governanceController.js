
import pool from '../config/database.js';

export const getAssemblies = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM assemblies ORDER BY date DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createAssembly = async (req, res) => {
    try {
        const [result] = await pool.query("INSERT INTO assemblies SET ?", [req.body]);
        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateAssembly = async (req, res) => {
    try {
        await pool.query("UPDATE assemblies SET ? WHERE id = ?", [req.body, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteAssembly = async (req, res) => {
    try {
        await pool.query("DELETE FROM assemblies WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDocuments = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM documents ORDER BY updated_at DESC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveDocument = async (req, res) => {
    try {
        const { id, title, content, type, status } = req.body;
        if (id && !String(id).startsWith('temp_')) {
            await pool.query("UPDATE documents SET title=?, content=?, type=?, status=? WHERE id=?", [title, content, type, status, id]);
            res.json({ success: true });
        } else {
            const [result] = await pool.query("INSERT INTO documents (title, content, type, status) VALUES (?,?,?,?)", [title, content, type, status]);
            res.json({ id: result.insertId, success: true });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteDocument = async (req, res) => {
    try {
        await pool.query("DELETE FROM documents WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
