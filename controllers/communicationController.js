
import pool from '../config/database.js';
import axios from 'axios';
import https from 'https';

/**
 * S.I.E PRO - WHATSAPP BROADCAST ENGINE V5.0 (SRE STABILIZED)
 * Orquestrador de mensageria ativa com suporte a variáveis dinâmicas.
 */
export const whatsappBroadcast = async (req, res) => {
    const { message, targetType, targetRole, userId, directNumber, footer } = req.body;
    const agent = new https.Agent({ rejectUnauthorized: false });

    try {
        // 1. Carregar configuração soberana
        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings) return res.status(400).json({ error: 'CONFIG_NOT_FOUND' });

        let config = settings.whatsapp_config;
        if (config && typeof config === 'string') {
            try { config = JSON.parse(config); } catch(e) { config = null; }
        }

        if (!config || !config.api_key) {
            return res.status(400).json({ error: 'GATEWAY_NOT_CONFIGURED' });
        }

        // 2. Resolver Destinatários
        let recipients = [];
        if (targetType === 'DIRECT') {
            recipients = [{ phone: directNumber, name: 'Membro' }];
        } else if (targetType === 'USER') {
            const [[user]] = await pool.query('SELECT phone, name FROM users WHERE id = ?', [userId]);
            if (user && user.phone) recipients = [user];
        } else {
            const [rows] = await pool.query(
                'SELECT phone, name FROM users WHERE (role = ? OR ? = "ALL") AND active = 1 AND phone IS NOT NULL', 
                [targetRole, targetRole]
            );
            recipients = rows;
        }

        if (recipients.length === 0) return res.status(404).json({ error: 'NO_RECIPIENTS_VALIDATED' });

        const effectiveFooter = footer || config.footer || settings.shortName || 'S.I.E PRO';
        let successCount = 0;

        // 3. Loop de Disparo com Personalização Neural
        for (const contact of recipients) {
            try {
                const firstName = (contact.name || 'Membro').split(' ')[0];
                // Regex Case-Insensitive para a variável {nome}
                const personalizedMessage = message.replace(/\{nome\}/gi, firstName);
                
                await axios({
                    method: 'post',
                    url: 'https://jennyai.space/send-message',
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
                console.error(`[SRE BROADCAST FAIL] ${contact.phone}:`, err.message); 
            }
        }

        // 4. Logar Ação no Sistema de Auditoria
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, table_name, details) VALUES (?, "WHATSAPP_BROADCAST", "communication", ?)',
            [req.user?.id || 0, `Envio em massa: ${successCount}/${recipients.length} entregues.`]
        );

        res.json({ 
            success: true, 
            summary: { total: recipients.length, delivered: successCount } 
        });

    } catch (e) {
        console.error("[SRE GATEWAY PANIC]", e);
        res.status(500).json({ error: `INTERNAL_GATEWAY_ERROR: ${e.message}` });
    }
};

/**
 * CRUD Agendamentos
 */
export const getSchedules = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM scheduled_broadcasts ORDER BY scheduled_at ASC');
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createSchedule = async (req, res) => {
    const { message, targetType, targetValue, scheduledAt } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO scheduled_broadcasts (user_id, target_type, target_value, message_body, scheduled_at, status) VALUES (?, ?, ?, ?, ?, "PENDING")',
            [req.user.id, targetType, targetValue, message, scheduledAt]
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

/**
 * SRE HEARTBEAT V6: O Motor de Automação Silenciosa
 * Chamado via setInterval no server.js para processar a fila.
 */
export const processScheduledMessages = async () => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    
    try {
        // Localizar PENDING que já atingiram o tempo
        const [pending] = await pool.query(
            'SELECT * FROM scheduled_broadcasts WHERE status = "PENDING" AND scheduled_at <= NOW() LIMIT 5'
        );

        if (pending.length === 0) return;

        const [[settings]] = await pool.query('SELECT whatsapp_config, shortName FROM settings WHERE id = 1');
        if (!settings?.whatsapp_config) return;

        let config = settings.whatsapp_config;
        if (typeof config === 'string') config = JSON.parse(config);

        for (const task of pending) {
            // Travamento imediato da task para evitar race condition
            await pool.query('UPDATE scheduled_broadcasts SET status = "SENT" WHERE id = ?', [task.id]);

            let recipients = [];
            if (task.target_type === 'DIRECT') {
                recipients = [{ phone: task.target_value, name: 'Membro' }];
            } else if (task.target_type === 'USER') {
                const [[user]] = await pool.query('SELECT phone, name FROM users WHERE id = ?', [task.target_value]);
                if (user?.phone) recipients = [user];
            } else {
                const [rows] = await pool.query('SELECT phone, name FROM users WHERE (role = ? OR ? = "ALL") AND active = 1', [task.target_value, task.target_value]);
                recipients = rows.filter(r => r.phone);
            }

            const footer = config.footer || settings.shortName || 'S.I.E PRO';

            for (const contact of recipients) {
                try {
                    const firstName = (contact.name || 'Membro').split(' ')[0];
                    const msg = task.message_body.replace(/\{nome\}/gi, firstName);
                    
                    await axios({
                        method: 'post',
                        url: 'https://jennyai.space/send-message',
                        params: {
                            api_key: config.api_key,
                            sender: config.sender,
                            number: contact.phone.replace(/\D/g, ''),
                            message: msg,
                            footer: footer
                        },
                        timeout: 10000,
                        httpsAgent: agent
                    });
                } catch (err) { 
                    console.error(`[SRE CRON FAIL] Task:${task.id} -> ${contact.phone}`); 
                }
            }
        }
    } catch (e) {
        console.error("[SRE HEARTBEAT ERROR]", e.message);
    }
};
