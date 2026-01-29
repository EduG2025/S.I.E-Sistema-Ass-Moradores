import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * CONFIGURAÇÃO SRE: Campos autorizados para saída (Segurança)
 * Nunca inclua 'password_hash' nesta lista.
 */
const SAFE_FIELDS = "id, name, cpf_cnpj, email, phone, role, status, unit, profession, age, birth_date, avatar_url, resident_type, active, coordinates, socialData, created_at";

/**
 * HELPER: Cálculo de idade biográfica
 */
const calculateAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
};

/**
 * HELPER: Sanitização de Objetos para JSON MySQL
 */
const stringifyJson = (data) => {
    if (!data) return null;
    return typeof data === 'object' ? JSON.stringify(data) : data;
};

/**
 * S.I.E PRO - ENGINE DE MEMBROS V12.6
 */

export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

        let query = `SELECT ${SAFE_FIELDS} FROM users WHERE active = 1`;
        let params = [];

        if (search) {
            query += ` AND (
                name LIKE ? OR 
                cpf_cnpj LIKE ? OR 
                unit LIKE ? OR 
                email LIKE ? OR 
                JSON_SEARCH(socialData, 'one', ?) IS NOT NULL
            )`;
            const s = `%${search}%`;
            params = [s, s, s, s, s];
        }

        query += " ORDER BY id DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(query, params);

        // Contagem Total (Otimizada para paginação)
        let countQuery = "SELECT COUNT(*) as total FROM users WHERE active = 1";
        let countParams = [];
        if (search) {
            countQuery += " AND (name LIKE ? OR cpf_cnpj LIKE ?)";
            countParams = [`%${search}%`, `%${search}%`];
        }
        const [[{ total }]] = await pool.query(countQuery, countParams);

        res.json({
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (e) {
        console.error("[SRE USER_FETCH FAIL]", e);
        res.status(500).json({ error: "ERRO_INTERNO_AO_BUSCAR_MEMBROS" });
    }
};

export const createUser = async (req, res) => {
    try {
        // WHITELIST: Apenas estes campos podem ser gravados (Proteção contra Over-posting)
        const { 
            name, cpf_cnpj, email, phone, password, unit, birth_date, 
            profession, resident_type, role, socialData, coordinates 
        } = req.body;

        const payload = {
            name: name?.toUpperCase(),
            cpf_cnpj: cpf_cnpj?.replace(/\D/g, ''),
            email,
            phone,
            unit,
            birth_date,
            profession,
            resident_type,
            role: role || 'RESIDENT',
            age: calculateAge(birth_date),
            socialData: stringifyJson(socialData) || '{}',
            coordinates: stringifyJson(coordinates),
            status: 'PENDING',
            active: 1
        };

        if (password) {
            payload.password_hash = await bcrypt.hash(password, 10);
        }

        const [result] = await pool.query("INSERT INTO users SET ?", [payload]);

        res.status(201).json({ id: result.insertId, success: true });
    } catch (e) {
        console.error("[SRE CREATE_USER FAIL]", e);
        res.status(500).json({ error: "FALHA_AO_CRIAR_REGISTRO" });
    }
};

export const updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...data } = req.body;

        // Whitelist de atualização
        const payload = {
            name: data.name?.toUpperCase(),
            email: data.email,
            phone: data.phone,
            unit: data.unit,
            profession: data.profession,
            resident_type: data.resident_type,
            birth_date: data.birth_date,
            age: calculateAge(data.birth_date),
            socialData: stringifyJson(data.socialData),
            coordinates: stringifyJson(data.coordinates)
        };

        if (password) {
            payload.password_hash = await bcrypt.hash(password, 10);
        }

        await pool.query("UPDATE users SET ? WHERE id = ?", [payload, id]);

        // Auditoria
        if (req.user) {
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "UPDATE_MEMBER", "users", ?, ?)',
                [req.user.id, id, `Alteração de perfil via painel administrativo`]
            );
        }

        res.json({ success: true });
    } catch (e) {
        console.error("[SRE UPDATE_MEMBER FAIL]", e);
        res.status(500).json({ error: "FALHA_AO_ATUALIZAR_MEMBRO" });
    }
};

export const updateAvatar = async (req, res) => {
    try {
        const { avatar_url } = req.body;
        const { id } = req.params;

        if (!avatar_url) return res.status(400).json({ error: "URL_OBRIGATORIA" });

        await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatar_url, id]);

        if (req.user) {
            await pool.query(
                'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "UPDATE_AVATAR", "users", ?, "Update de Biometria Facial")',
                [req.user.id, id]
            );
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "ERRO_AO_ATUALIZAR_AVATAR" });
    }
};

/**
 * SEARCH NEURAL V4.2 - SQL JSON Otimizado
 */
export const searchNeural = async (req, res) => {
    const { query, filters } = req.body;

    try {
        let sql = `SELECT ${SAFE_FIELDS} FROM users WHERE active = 1`;
        let params = [];

        if (query) {
            const s = `%${query}%`;
            sql += " AND (name LIKE ? OR cpf_cnpj LIKE ? OR JSON_SEARCH(socialData, 'one', ?) IS NOT NULL)";
            params.push(s, s, s);
        }

        // Filtros avançados usando o operador ->> (JSON Extract)
        if (filters?.vulnerability) {
            sql += " AND socialData->>'$.vulnerabilities' LIKE ?";
            params.push(`%${filters.vulnerability}%`);
        }

        if (filters?.income_range) {
            sql += " AND socialData->>'$.income_range' = ?";
            params.push(filters.income_range);
        }

        sql += " LIMIT 20";

        const [rows] = await pool.query(sql, params);

        res.json({
            internal: rows,
            meta: { 
                results: rows.length, 
                engine: 'MYSQL_8_JSON_OPTIMIZED' 
            }
        });
    } catch (e) {
        console.error("[SRE NEURAL FAIL]", e);
        res.status(500).json({ error: "TIMEOUT_NA_BUSCA_NEURAL" });
    }
};

export const generateInvite = async (req, res) => {
    try {
        const userId = req.params.id;
        res.json({
            success: true,
            link: `/census/register?ref=${userId}`,
            protocol: 'SIE_INVITE_V1'
        });
    } catch (e) {
        res.status(500).json({ error: "FALHA_AO_GERAR_CONVITE" });
    }
};

export const activateUser = async (req, res) => {
    try {
        await pool.query("UPDATE users SET status = 'ACTIVE', active = 1 WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { 
        res.status(500).json({ error: "ERRO_NA_ATIVACAO" }); 
    }
};

export const getDependents = async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT ${SAFE_FIELDS} FROM users WHERE parent_id = ?`, [req.params.id]);
        res.json({ data: rows });
    } catch (e) { 
        res.status(500).json({ error: "ERRO_AO_BUSCAR_DEPENDENTES" }); 
    }
};