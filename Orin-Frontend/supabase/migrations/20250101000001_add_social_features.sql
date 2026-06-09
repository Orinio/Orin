-- Social features: follows, likes, comments, direct messages
-- Migration: 20250101000001_add_social_features.sql

-- ═══════════════════════════════════════════
-- FOLLOWS — User follow/unfollow system
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see all follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = follower_id
  ));

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = follower_id
  ));

-- ═══════════════════════════════════════════
-- LIKES — Like proof cards and posts
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_card_id UUID NOT NULL REFERENCES proof_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, proof_card_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_proof ON likes(proof_card_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see all likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like proof cards"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = user_id
  ));

-- ═══════════════════════════════════════════
-- COMMENTS — Comment on proof cards
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_card_id UUID NOT NULL REFERENCES proof_cards(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_proof ON comments(proof_card_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see all comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = user_id
  ));

-- ═══════════════════════════════════════════
-- MESSAGES — Direct messaging between users
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can see conversation participants"
  ON conversation_participants FOR SELECT
  USING (true);

CREATE POLICY "System can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their read status"
  ON conversation_participants FOR UPDATE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = user_id
  ));

CREATE POLICY "Users can see messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = sender_id
  ));

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = sender_id
  ));

-- ═══════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════

-- Get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(target_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE following_id = target_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = target_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM follows WHERE follower_id = follower AND following_id = following
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get like count for a proof card
CREATE OR REPLACE FUNCTION get_like_count(target_proof_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM likes WHERE proof_card_id = target_proof_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user liked a proof card
CREATE OR REPLACE FUNCTION has_liked(target_user_id UUID, target_proof_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM likes WHERE user_id = target_user_id AND proof_card_id = target_proof_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get comment count for a proof card
CREATE OR REPLACE FUNCTION get_comment_count(target_proof_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM comments WHERE proof_card_id = target_proof_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
