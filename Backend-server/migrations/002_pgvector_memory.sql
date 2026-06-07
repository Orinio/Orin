-- Migration: Enable pgvector and add embedding columns for AI memory
-- Run this in Supabase SQL editor or via migration system

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 2. Add embedding column to ai_skill_memory
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_skill_memory') THEN
    EXECUTE 'ALTER TABLE ai_skill_memory ADD COLUMN IF NOT EXISTS embedding vector(1024)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_skill_memory_embedding ON ai_skill_memory USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- 3. Add embedding column to ai_facts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_facts') THEN
    EXECUTE 'ALTER TABLE ai_facts ADD COLUMN IF NOT EXISTS embedding vector(1024)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_facts_embedding ON ai_facts USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- 4. Add embedding column to chat_conversations (created by app on first chat save)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'chat_conversations') THEN
    EXECUTE 'ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS embedding vector(1024)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chat_conversations_embedding ON chat_conversations USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)';
  END IF;
END $$;

-- 5. Add embedding column to ai_user_preferences (created by app on first preference save)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_user_preferences') THEN
    EXECUTE 'ALTER TABLE ai_user_preferences ADD COLUMN IF NOT EXISTS embedding vector(1024)';
  END IF;
END $$;

-- 6. Create a function for semantic memory search
-- Handles missing tables gracefully by returning empty results
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
BEGIN
  RETURN QUERY
  WITH skill_matches AS (
    SELECT
      sm.id,
      sm.skill::text as content,
      'skill'::text as memory_type,
      1 - (sm.embedding <=> query_embedding)::float as similarity,
      jsonb_build_object('level', sm.level, 'source', sm.source) as metadata
    FROM ai_skill_memory sm
    WHERE sm.user_id = user_id_param
      AND sm.embedding IS NOT NULL
      AND 1 - (sm.embedding <=> query_embedding) > similarity_threshold
  ),
  fact_matches AS (
    SELECT
      f.id,
      f.fact::text as content,
      'fact'::text as memory_type,
      1 - (f.embedding <=> query_embedding)::float as similarity,
      COALESCE(f.metadata, '{}'::jsonb) as metadata
    FROM ai_facts f
    WHERE f.user_id = user_id_param
      AND f.embedding IS NOT NULL
      AND 1 - (f.embedding <=> query_embedding) > similarity_threshold
  ),
  conv_matches AS (
    SELECT
      c.id,
      COALESCE(c.title, 'Conversation')::text as content,
      'conversation'::text as memory_type,
      1 - (c.embedding <=> query_embedding)::float as similarity,
      jsonb_build_object('agent_id', c.agent_id, 'message_count', c.message_count) as metadata
    FROM chat_conversations c
    WHERE c.user_id = user_id_param
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  )
  SELECT * FROM skill_matches
  UNION ALL
  SELECT * FROM fact_matches
  UNION ALL
  SELECT * FROM conv_matches
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$;

-- 7. Add unique constraint on ai_goals to prevent duplicates
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

-- 8. Add unique constraint on ai_facts to prevent duplicate facts
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