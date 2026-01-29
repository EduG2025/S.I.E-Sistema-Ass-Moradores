
import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';

/**
 * SRE Personalization Engine: Resolve variáveis contextuais em templates.
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
 * SRE Helper: Normaliza o número para o padrão exigido pelo gateway (DDI 55 Brasil se ausente).
 */
const normalizePhone = (num) => {
    const clean = String(num || '').replace(/\D/g, '');
    if (!clean) return '';
    // Se o número tem 10 ou 11 dígitos (padrão BR sem DDI), injeta 55
    if (clean.length === 10 || clean.length === 11) {
        return '55' + clean;
    }
    return clean;
};

/**
 * S.I.E PRO - WHATSAPP BROADCAST ENGINE V11.0 (AUTO-FIX NUMBER & MEDIA READY)
 */
export const whatsappBroadcast = async (req, res) => {
    const { message, templateId, targetType, targetRole, userId, directNumber, footer, contextData, mediaUrl, mediaType } = req.body;
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings) return res.status(400).json({ error: 'CONFIG_NOT_FOUND' });

        let config = settings.whatsapp_config;
        if (config && typeof config === 'string') config = JSON.parse(config);

        if (!config || !config.api_key) {
            return res.status(400).json({ error: 'MESSENGER_NOT_CONFIGURED' });
        }

        let effectiveMessage = message;
        let effectiveMediaUrl = mediaUrl;
        let effectiveMediaType = mediaType || 'image';

        if (templateId) {
            const [[tpl]] = await pool.query('SELECT content, media_url, media_type FROM message_templates WHERE id = ?', [templateId]);
            if (tpl) {
                effectiveMessage = tpl.content;
                if (!effectiveMediaUrl) effectiveMediaUrl = tpl.media_url;
                if (!mediaType) effectiveMediaType = tpl.media_type || 'image';
            }
        }

        let recipients = [];
        if (targetType === 'DIRECT') {
            recipients = [{ phone: directNumber, name: 'Membro Externo' }];
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

        if (recipients.length === 0) return res.status(404).json({ error: 'NO_VALID_RECIPIENTS_FOUND' });

        // Determinação de Endpoint (Media vs Text)
        const baseUrl = config.gateway_url?.replace('/send-message', '')?.replace('/send-media', '') || 'https://jennyai.space';
        const isMedia = !!effectiveMediaUrl;
        const endpoint = isMedia ? `${baseUrl}/send-media` : `${baseUrl}/send-message`;

        const effectiveFooter = footer || config.footer || settings.shortName || 'S.I.E PRO';
        let successCount = 0;

        for (const contact of recipients) {
            try {
                const firstName = (contact.name || 'Membro').split(' ')[0];
                const personalizedMessage = resolveTemplate(effectiveMessage, {
                    nome: firstName,
                    unidade: contact.unit || 'HUB',
                    sigla: settings.shortName,
                    ...(contextData || {})
                });

                const targetNumber = normalizePhone(contact.phone);
                if (!targetNumber) continue;

                const payload = {
                    api_key: config.api_key,
                    sender: config.sender,
                    number: targetNumber,
                    footer: effectiveFooter
                };

                if (isMedia) {
                    payload.media_type = effectiveMediaType;
                    payload.caption = personalizedMessage;
                    payload.url = effectiveMediaUrl;
                } else {
                    payload.message = personalizedMessage;
                }

                await axios({
                    method: 'post',
                    url: endpoint,
                    data: payload,
                    timeout: 20000,
                    httpsAgent: agent
                });
                successCount++;
            } catch (err) {
                console.error(`[SRE DISPATCH FAIL] Recipient: ${contact.phone} | Endpoint: ${endpoint} | Error: ${err.message}`);
            }
        }

        // Auditoria SRE
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, "WHATSAPP_BROADCAST", "communication", 0, ?)',
            [req.user?.id || 0, `Entregues: ${successCount}/${recipients.length} via Endpoint: ${endpoint}`]
        );

        res.json({ success: true, summary: { total: recipients.length, delivered: successCount, type: isMedia ? 'MEDIA' : 'TEXT' } });

    } catch (e) {
        res.status(500).json({ error: `GATEWAY_PANIC: ${e.message}` });
    }
};

/**
 * JENNYAI WEBHOOK RECEIVER (INBOUND)
 */
export const receiveWebhook = async (req, res) => {
    try {
        const payload = req.body;
        console.log(`[SRE INBOUND] Mensagem recebida:`, payload);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

/**
 * TEMPLATE MANAGEMENT
 */
export const getTemplates = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM message_templates ORDER BY name ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveTemplate = async (req, res) => {
    const { id, event_trigger, name, content, variables_available, is_active, attach_logo, media_url, media_type } = req.body;
    try {
        if (id) {
            await pool.query('UPDATE message_templates SET event_trigger=?, name=?, content=?, variables_available=?, is_active=?, attach_logo=?, media_url=?, media_type=? WHERE id=?',
                [event_trigger, name, content, JSON.stringify(variables_available), is_active, attach_logo || 0, media_url || null, media_type || 'image', id]);
        } else {
            await pool.query('INSERT INTO message_templates (event_trigger, name, content, variables_available, is_active, attach_logo, media_url, media_type) VALUES (?,?,?,?,?,?,?,?)',
                [event_trigger, name, content, JSON.stringify(variables_available), is_active, attach_logo || 0, media_url || null, media_type || 'image']);
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
 * SCHEDULER: PROCESSAMENTO DE FILA
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

        for (const task of pending) {
            await pool.query('UPDATE scheduled_broadcasts SET status = "SENT" WHERE id = ?', [task.id]);

            let effectiveContent = task.message_body;
            let mUrl = null;
            let mType = 'image';

            if (task.template_id) {
                const [[tpl]] = await pool.query('SELECT content, media_url, media_type FROM message_templates WHERE id = ?', [task.template_id]);
                if (tpl) {
                    effectiveContent = tpl.content;
                    mUrl = tpl.media_url;
                    mType = tpl.media_type || 'image';
                }
            }

            let recipients = [];
            if (task.target_type === 'DIRECT') {
                recipients = [{ phone: task.target_value, name: 'Membro Externo' }];
            } else if (task.target_type === 'USER') {
                const [[user]] = await pool.query('SELECT phone, name, unit FROM users WHERE id = ?', [task.target_value]);
                if (user?.phone) recipients = [user];
            } else {
                const [rows] = await pool.query('SELECT phone, name, unit FROM users WHERE (role = ? OR ? = "ALL") AND active = 1', [task.target_value, task.target_value]);
                recipients = rows.filter(r => r.phone);
            }

            const isMedia = !!mUrl;
            const baseUrl = config.gateway_url?.replace('/send-message', '')?.replace('/send-media', '') || 'https://jennyai.space';
            const endpoint = isMedia ? `${baseUrl}/send-media` : `${baseUrl}/send-message`;

            for (const contact of recipients) {
                try {
                    const personalized = resolveTemplate(effectiveContent, {
                        nome: contact.name.split(' ')[0],
                        unidade: contact.unit || 'HUB',
                        sigla: settings.shortName
                    });

                    const targetNumber = normalizePhone(contact.phone);
                    if (!targetNumber) continue;

                    const payload = {
                        api_key: config.api_key,
                        sender: config.sender,
                        number: targetNumber,
                        footer: config.footer || settings.shortName
                    };

                    if (isMedia) {
                        payload.media_type = mType;
                        payload.caption = personalized;
                        payload.url = mUrl;
                    } else {
                        payload.message = personalized;
                    }

                    await axios({
                        method: 'post',
                        url: endpoint,
                        data: payload,
                        timeout: 10000,
                        httpsAgent: agent
                    });
                } catch (err) { console.error(`[SRE SCHED FAIL] Task ${task.id}: ${err.message}`); }
            }
        }
    } catch (e) { console.error("[SRE SCHEDULER PANIC]", e.message); }
};
