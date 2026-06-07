import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export const chatRouter = Router();

const saveConversationSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  messages: z.array(z.any()).optional(),
  messageCount: z.number().optional(),
  agentId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

chatRouter.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    const conversations = (data || []).map((row: any) => ({
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
  } catch (err) {
    logger.error({ err }, 'Chat list error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

chatRouter.get('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const { data, error } = await supabase
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
  } catch (err) {
    logger.error({ err }, 'Chat get error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

chatRouter.post('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const parsed = saveConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
      return;
    }

    const { id, title, messages, messageCount, agentId, createdAt, updatedAt } = parsed.data;

    const { error } = await supabase
      .from('chat_conversations')
      .upsert({
        id,
        user_id: userId,
        agent_id: agentId || null,
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
  } catch (err) {
    logger.error({ err }, 'Chat save error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

chatRouter.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Chat delete error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});
