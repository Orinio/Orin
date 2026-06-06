-- Orin AI - Memory System Tables
-- Creates tables for AI agent memory, conversations, and user preferences

-- ============================================================
-- Conversations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_agent 
ON ai_conversations(user_id, agent_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_created 
ON ai_conversations(created_at DESC);

-- ============================================================
-- User Preferences Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_style TEXT,
  communication_tone TEXT DEFAULT 'professional',
  interests TEXT[] DEFAULT '{}',
  career_goals TEXT[] DEFAULT '{}',
  target_roles TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- Skill Memory Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_skill_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  confidence DECIMAL(3,2) DEFAULT 0.5,
  source TEXT,
  last_assessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_ai_skill_memory_user 
ON ai_skill_memory(user_id);

-- ============================================================
-- Learning Progress Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_learning_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0,
  milestones JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_learning_progress_user 
ON ai_learning_progress(user_id);

-- ============================================================
-- Goals Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  progress DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_goals_user_status 
ON ai_goals(user_id, status);

-- ============================================================
-- Facts Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  category TEXT,
  importance DECIMAL(3,2) DEFAULT 0.5,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_facts_user 
ON ai_facts(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_facts_category 
ON ai_facts(category);

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" 
ON ai_conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" 
ON ai_conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
ON ai_conversations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
ON ai_conversations FOR DELETE 
USING (auth.uid() = user_id);

-- User Preferences
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" 
ON ai_user_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
ON ai_user_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
ON ai_user_preferences FOR UPDATE 
USING (auth.uid() = user_id);

-- Skill Memory
ALTER TABLE ai_skill_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills" 
ON ai_skill_memory FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills" 
ON ai_skill_memory FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills" 
ON ai_skill_memory FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills" 
ON ai_skill_memory FOR DELETE 
USING (auth.uid() = user_id);

-- Learning Progress
ALTER TABLE ai_learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning progress" 
ON ai_learning_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress" 
ON ai_learning_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress" 
ON ai_learning_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- Goals
ALTER TABLE ai_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" 
ON ai_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" 
ON ai_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" 
ON ai_goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" 
ON ai_goals FOR DELETE 
USING (auth.uid() = user_id);

-- Facts
ALTER TABLE ai_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own facts" 
ON ai_facts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own facts" 
ON ai_facts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own facts" 
ON ai_facts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own facts" 
ON ai_facts FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================
-- Auto-update timestamps trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_ai_conversations_updated_at 
BEFORE UPDATE ON ai_conversations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_user_preferences_updated_at 
BEFORE UPDATE ON ai_user_preferences 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_goals_updated_at 
BEFORE UPDATE ON ai_goals 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
