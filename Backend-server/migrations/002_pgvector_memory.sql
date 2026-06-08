-- Migration 002: Enable pgvector and add embedding columns for AI memory
-- Run this in Supabase SQL editor or via migration system

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Create chat_conversations table if it doesn't exist
-- (This table stores AI conversation history with semantic search support)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  title text,
  messages jsonb DEFAULT '[]'::jsonb,
  message_count integer DEFAULT 0,
  embedding vector(1024),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_agent
  ON chat_conversations(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated
  ON chat_conversations(updated_at DESC);

-- 3. Add embedding column to ai_skill_memory
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_skill_memory') THEN
    EXECUTE 'ALTER TABLE ai_skill_memory ADD COLUMN IF NOT EXISTS embedding vector(1024)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_skill_memory_embedding ON ai_skill_memory USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- 4. Add embedding column to ai_facts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_facts') THEN
    EXECUTE 'ALTER TABLE ai_facts ADD COLUMN IF NOT EXISTS embedding vector(1024)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_facts_embedding ON ai_facts USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- 5. Add embedding column to chat_conversations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chat_conversations') THEN
    EXECUTE 'ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS embedding vector(1024)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chat_conversations_embedding ON chat_conversations USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- 6. Add embedding column to ai_user_preferences (created by app on first preference save)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_user_preferences') THEN
    EXECUTE 'ALTER TABLE ai_user_preferences ADD COLUMN IF NOT EXISTS embedding vector(1024)';
  END IF;
END $$;

-- 7. Create semantic memory search function (dynamic SQL for resilience)
-- Uses EXECUTE to avoid compile-time table validation errors
CREATE OR REPLACE FUNCTION search_memories_semantic(
  query_embedding vector(1024),
  user_id_param uuid,
  similarity_threshold float DEFAULT 0.3,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  memory_type text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
  _query text := '';
  _has_tables boolean := false;
  _emb_text text;
  _uid_text text;
BEGIN
  _emb_text := query_embedding::text;
  _uid_text := user_id_param::text;

  -- Skill memory (if table exists)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_skill_memory') THEN
    _query := format(
      'SELECT sm.id, sm.skill::text as content, %L::text as memory_type, 1 - (sm.embedding <=> %L::vector)::float as similarity, jsonb_build_object(''level'', sm.level, ''source'', sm.source) as metadata FROM ai_skill_memory sm WHERE sm.user_id = %L::uuid AND sm.embedding IS NOT NULL AND 1 - (sm.embedding <=> %L::vector) > %s',
      'skill', _emb_text, _uid_text, _emb_text, similarity_threshold
    );
    _has_tables := true;
  END IF;

  -- Facts (if table exists)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_facts') THEN
    IF _has_tables THEN
      _query := _query || ' UNION ALL ';
    END IF;
    _query := _query || format(
      'SELECT f.id, f.fact::text as content, %L::text as memory_type, 1 - (f.embedding <=> %L::vector)::float as similarity, COALESCE(f.metadata, ''{}''::jsonb) as metadata FROM ai_facts f WHERE f.user_id = %L::uuid AND f.embedding IS NOT NULL AND 1 - (f.embedding <=> %L::vector) > %s',
      'fact', _emb_text, _uid_text, _emb_text, similarity_threshold
    );
    _has_tables := true;
  END IF;

  -- Conversations (if table exists)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chat_conversations') THEN
    IF _has_tables THEN
      _query := _query || ' UNION ALL ';
    END IF;
    _query := _query || format(
      'SELECT c.id, COALESCE(c.title, %L)::text as content, %L::text as memory_type, 1 - (c.embedding <=> %L::vector)::float as similarity, jsonb_build_object(''agent_id'', c.agent_id, ''message_count'', c.message_count) as metadata FROM chat_conversations c WHERE c.user_id = %L::uuid AND c.embedding IS NOT NULL AND 1 - (c.embedding <=> %L::vector) > %s',
      'Conversation', 'conversation', _emb_text, _uid_text, _emb_text, similarity_threshold
    );
    _has_tables := true;
  END IF;

  IF NOT _has_tables THEN
    RETURN;
  END IF;

  _query := _query || format(' ORDER BY similarity DESC LIMIT %s', max_results);

  RETURN QUERY EXECUTE _query;
END;
$$;

-- 8. Add unique constraint on ai_goals to prevent duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_goals') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'ai_goals_user_goal_unique'
    ) THEN
      ALTER TABLE ai_goals ADD CONSTRAINT ai_goals_user_goal_unique UNIQUE (user_id, goal);
    END IF;
  END IF;
END $$;

-- 9. Add unique constraint on ai_facts to prevent duplicate facts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_facts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'ai_facts_user_fact_unique'
    ) THEN
      ALTER TABLE ai_facts ADD CONSTRAINT ai_facts_user_fact_unique UNIQUE (user_id, fact);
    END IF;
  END IF;
END $$;
