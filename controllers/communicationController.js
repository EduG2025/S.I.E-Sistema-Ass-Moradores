import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';

/**
 * SRE Substitution Engine: Resolve variáveis contextuais em templates.
 */
const resolveTemplate = (content, data) => {
    if (!content) return "";
    let resolved = content;
    Object.entries(data).forEach(([key, val]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'gi');
        resolved = resolved.replace(regex, val || '---');
    });
    return resolved;
};

/**
 * S.I.E PRO - WHATSAPP BROADCAST ENGINE V6.5 (SRE TAC-COM)
 */
export const whatsappBroadcast = async (req, res) => {
    const { message, templateId, targetType, targetRole, userId, directNumber, footer, contextData } = req.body;
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings) return res.status(400).json({ error: 'CONFIG_NOT_FOUND' });

        let config = settings.whatsapp_config;
        if (config && typeof config === 'string') config = JSON.parse(config);

        if (!config || !config.api_key) return res.status(400).json({ error: 'GATEWAY_NOT_CONFIGURED' });

        // URL SOBERANA: Usa a URL do DB ou fallback global
        const gatewayUrl = config.gateway_url || 'https://jennyai.space/send-message';

        let effectiveMessage = message;
        if (templateId) {
            const [[tpl]] = await pool.query('SELECT content FROM message_templates WHERE id = ?', [templateId]);
            if (tpl) effectiveMessage = tpl.content;
        }

        let recipients = [];
        if (targetType === 'DIRECT') {
            recipients = [{ phone: directNumber, name: 'Membro' }];
        } else if (targetType === 'USER') {
            const [[user]] = await pool.query('SELECT phone, name, unit FROM users WHERE id = ?', [userId]);
            if (user && user.phone) recipients = [user];
        } else {
            const [rows] = await pool.query(
                'SELECT phone, name, unit FROM users WHERE (role = ? OR ? = "ALL") AND active = 1 AND phone IS NOT NULL', 
                [targetRole, targetRole]
            );
            recipients = rows;
        }

        if (recipients.length === 0) return res.status(404).json({ error: 'NO_RECIPIENTS_VALIDATED' });

        const effectiveFooter = footer || config.footer || settings.shortName || 'S.I.E PRO';
        let successCount = 0;

        for (const contact of recipients) {
            try {
                const firstName = (contact.name || 'Membro').split(' ')[0];
                const substitutionData = {
                    nome: firstName,
                    unidade: contact.unit || 'HUB',
                    sigla: settings.shortName,
                    ...(contextData || {})
                };

                const personalizedMessage = resolveTemplate(effectiveMessage, substitutionData);
                
                await axios({
                    method: 'post',
                    url: gatewayUrl,
                    params: {
                        api_key: config.api_key,
                        sender: config.sender,
                        number: contact.phone.replace(/\D/g, ''),
                        message: personalizedMessage,
                        footer: effectiveFooter
                    },
                    timeout: 15000,
                    httpsAgent: agent
                });
                successCount++;
            } catch (err) { 
                console.error(`[SRE BROADCAST FAIL] ${contact.phone} via ${gatewayUrl}:`, err.message); 
            }
        }

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, details) VALUES (?, "WHATSAPP_BROADCAST", "communication", ?)',
            [req.user?.id || 0, `Url: ${gatewayUrl} | Entregues: ${successCount}/${recipients.length}`]
        );

        res.json({ success: true, summary: { total: recipients.length, delivered: successCount } });

    } catch (e) {
        res.status(500).json({ error: `INTERNAL_GATEWAY_ERROR: ${e.message}` });
    }
};

/**
 * TEMPLATE MANAGEMENT ENDPOINTS
 */
export const getTemplates = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM message_templates ORDER BY name ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveTemplate = async (req, res) => {
    const { id, event_trigger, name, content, variables_available, is_active } = req.body;
    try {
        if (id) {
            await pool.query('UPDATE message_templates SET event_trigger=?, name=?, content=?, variables_available=?, is_active=? WHERE id=?', 
                [event_trigger, name, content, JSON.stringify(variables_available), is_active, id]);
        } else {
            await pool.query('INSERT INTO message_templates (event_trigger, name, content, variables_available, is_active) VALUES (?,?,?,?,?)', 
                [event_trigger, name, content, JSON.stringify(variables_available), is_active]);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteTemplate = async (req, res) => {
    try {
        await pool.query('DELETE FROM message_templates WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

/**
 * FILA & AGENDAMENTOS
 */
export const getSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM scheduled_broadcasts ORDER BY scheduled_at ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createSchedule = async (req, res) => {
    const { message, templateId, targetType, targetValue, scheduledAt } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, template_id, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, "PENDING")',
            [req.user.id, targetType, targetValue, message, templateId, scheduledAt]
        );
        res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteSchedule = async (req, res) => {
    try {
        await pool.query('DELETE FROM scheduled_broadcasts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const processScheduledMessages = async () => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    try {
        const [pending] = await pool.query('SELECT * FROM scheduled_broadcasts WHERE status = "PENDING" AND scheduled_at <= NOW() LIMIT 5');
        if (pending.length === 0) return;

        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings?.whatsapp_config) return;
        let config = JSON.parse(settings.whatsapp_config);
        const gatewayUrl = config.gateway_url || 'https://jennyai.space/send-message';

        for (const task of pending) {
            await pool.query('UPDATE scheduled_broadcasts SET status = "SENT" WHERE id = ?', [task.id]);

            let effectiveContent = task.message_body;
            if (task.template_id) {
                const [[tpl]] = await pool.query('SELECT content FROM message_templates WHERE id = ?', [task.template_id]);
                if (tpl) effectiveContent = tpl.content;
            }

            let recipients = [];
            if (task.target_type === 'DIRECT') {
                recipients = [{ phone: task.target_value, name: 'Membro' }];
            } else if (task.target_type === 'USER') {
                const [[user]] = await pool.query('SELECT phone, name, unit FROM users WHERE id = ?', [task.target_value]);
                if (user?.phone) recipients = [user];
            } else {
                const [rows] = await pool.query('SELECT phone, name, unit FROM users WHERE (role = ? OR ? = "ALL") AND active = 1', [task.target_value, task.target_value]);
                recipients = rows.filter(r => r.phone);
            }

            for (const contact of recipients) {
                try {
                    const personalized = resolveTemplate(effectiveContent, {
                        nome: contact.name.split(' ')[0],
                        unidade: contact.unit || 'HUB',
                        sigla: settings.shortName
                    });
                    await axios({
                        method: 'post',
                        url: gatewayUrl,
                        params: {
                            api_key: config.api_key,
                            sender: config.sender,
                            number: contact.phone.replace(/\D/g, ''),
                            message: personalized,
                            footer: config.footer || settings.shortName
                        },
                        timeout: 10000,
                        httpsAgent: agent
                    });
                } catch (err) { console.error(`[SRE HEARTBEAT FAIL] ${contact.phone} via ${gatewayUrl}`); }
            }
        }
    } catch (e) { console.error("[SRE HEARTBEAT ERROR]", e.message); }
};