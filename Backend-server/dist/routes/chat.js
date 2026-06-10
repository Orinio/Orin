"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
exports.chatRouter = (0, express_1.Router)();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const saveConversationSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().optional(),
    messages: zod_1.z.array(zod_1.z.any()).optional(),
    messageCount: zod_1.z.number().optional(),
    agentId: zod_1.z.string().optional().default('chat'),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
exports.chatRouter.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const { data, error } = await supabase_js_1.supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(100);
        if (error) {
            res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
            return;
        }
        const conversations = (data || []).map((row) => ({
            id: row.id,
            userId: row.user_id,
            agentId: row.agent_id,
            title: row.title,
            messages: row.messages || [],
            messageCount: row.message_count || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            storage: 'cloud',
        }));
        res.json({ success: true, data: conversations });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Chat list error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.chatRouter.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const { id } = req.params;
        const { data, error } = await supabase_js_1.supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
            return;
        }
        res.json({
            success: true,
            data: {
                id: data.id,
                userId: data.user_id,
                agentId: data.agent_id,
                title: data.title,
                messages: data.messages || [],
                messageCount: data.message_count || 0,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                storage: 'cloud',
            },
        });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Chat get error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.chatRouter.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const parsed = saveConversationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
            return;
        }
        const { id, title, messages, messageCount, agentId, createdAt, updatedAt } = parsed.data;
        const conversationId = UUID_RE.test(id) ? id : (0, crypto_1.randomUUID)();
        const { error } = await supabase_js_1.supabase
            .from('chat_conversations')
            .upsert({
            id: conversationId,
            user_id: userId,
            agent_id: agentId,
            title: title || 'New conversation',
            messages: messages || [],
            message_count: messageCount || 0,
            created_at: createdAt || new Date().toISOString(),
            updated_at: updatedAt || new Date().toISOString(),
        }, { onConflict: 'id' });
        if (error) {
            res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
            return;
        }
        res.json({ success: true, data: { saved: true } });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Chat save error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.chatRouter.delete('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const { id } = req.params;
        const { error } = await supabase_js_1.supabase
            .from('chat_conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
            return;
        }
        res.json({ success: true });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Chat delete error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
//# sourceMappingURL=chat.js.map