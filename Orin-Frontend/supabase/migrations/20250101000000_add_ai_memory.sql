-- AI Memory Store — persists user context across conversations
-- Categories: preference, goal, skill, context, fact

CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('preference', 'goal', 'skill', 'context', 'fact')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence REAL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- One entry per user+category+key combination
  UNIQUE(user_id, category, key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_category ON ai_memory(user_id, category);
CREATE INDEX IF NOT EXISTS idx_ai_memory_updated ON ai_memory(user_id, updated_at DESC);

-- RLS policies
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;

-- Users can only read their own memory
CREATE POLICY "Users read own memory" ON ai_memory
  FOR SELECT USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = ai_memory.user_id
  ));

-- Users can insert their own memory
CREATE POLICY "Users insert own memory" ON ai_memory
  FOR INSERT WITH CHECK (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = ai_memory.user_id
  ));

-- Users can update their own memory
CREATE POLICY "Users update own memory" ON ai_memory
  FOR UPDATE USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = ai_memory.user_id
  ));

-- Users can delete their own memory
CREATE POLICY "Users delete own memory" ON ai_memory
  FOR DELETE USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = ai_memory.user_id
  ));
