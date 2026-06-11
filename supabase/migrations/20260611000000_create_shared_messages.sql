-- Shared messages table for permalink/share functionality
CREATE TABLE IF NOT EXISTS shared_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant',
  agent_name TEXT NOT NULL DEFAULT 'Orin',
  thinking TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Index for fast lookups by share_id
CREATE INDEX IF NOT EXISTS idx_shared_messages_share_id ON shared_messages(share_id);

-- Auto-cleanup expired shared messages (run periodically)
-- ALTER TABLE shared_messages ADD CONSTRAINT shared_messages_share_id_unique UNIQUE (share_id);

-- Row Level Security (optional, can be disabled for public reads)
ALTER TABLE shared_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access for shared messages
CREATE POLICY "Public can read shared messages" ON shared_messages
  FOR SELECT USING (true);

-- Allow authenticated users to create shared messages
CREATE POLICY "Authenticated users can create shared messages" ON shared_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
