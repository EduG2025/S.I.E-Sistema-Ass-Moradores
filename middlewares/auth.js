
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_production_master_2025';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'TOKEN_REQUIRED' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'INVALID_TOKEN' });
        req.user = user;
        next();
    });
};

export const requireAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.virtual)) {
        return next();
    }
    res.status(403).json({ error: 'ADMIN_REQUIRED' });
};

/**
 * SRE Granular Permission Guard
 */
export const checkPermission = (permissionId) => {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });
        
        if (req.user.virtual || req.user.role === 'ADMIN') return next();

        try {
            const [rows] = await pool.query(
                'SELECT 1 FROM role_permissions WHERE role = ? AND permission_id = ?',
                [req.user.role, permissionId]
            );

            if (rows.length > 0) return next();
            
            res.status(403).json({ 
                error: 'PERMISSION_DENIED', 
                required: permissionId,
                current_role: req.user.role
            });
        } catch (e) {
            res.status(500).json({ error: 'AUTH_DB_FAILURE' });
        }
    };
};
