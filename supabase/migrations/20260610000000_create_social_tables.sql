-- ═══════════════════════════════════════════════════════════════
-- SOCIAL FEATURES: Follows, Likes, Comments, Messaging
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- FOLLOWS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Prevent self-follows
ALTER TABLE follows ADD CONSTRAINT follows_no_self CHECK (follower_id != following_id);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follows for public profiles
CREATE POLICY follows_select_public ON follows
  FOR SELECT USING (true);

-- Authenticated users can insert their own follows
CREATE POLICY follows_insert_own ON follows
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = follower_id));

-- Users can delete their own follows
CREATE POLICY follows_delete_own ON follows
  FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = follower_id));

-- Admins can do everything
CREATE POLICY follows_admin_all ON follows
  FOR ALL USING (is_admin_or_mod());


-- ───────────────────────────────────────────────────────────────
-- LIKES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_card_id UUID NOT NULL REFERENCES proof_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, proof_card_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_proof ON likes(proof_card_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see likes on public proofs
CREATE POLICY likes_select_public ON likes
  FOR SELECT USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY likes_insert_own ON likes
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Users can delete their own likes
CREATE POLICY likes_delete_own ON likes
  FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY likes_admin_all ON likes
  FOR ALL USING (is_admin_or_mod());


-- ───────────────────────────────────────────────────────────────
-- COMMENTS (threaded)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proof_card_id UUID NOT NULL REFERENCES proof_cards(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_proof ON comments(proof_card_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can see comments on public proofs
CREATE POLICY comments_select_public ON comments
  FOR SELECT USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY comments_insert_own ON comments
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Users can update their own comments
CREATE POLICY comments_update_own ON comments
  FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Users can delete their own comments, proof owners can delete comments on their proofs
CREATE POLICY comments_delete_own ON comments
  FOR DELETE USING (
    auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
    OR auth.uid() = (SELECT u.auth_user_id FROM users u JOIN proof_cards pc ON pc.user_id = u.id WHERE pc.id = proof_card_id)
  );

CREATE POLICY comments_admin_all ON comments
  FOR ALL USING (is_admin_or_mod());


-- ───────────────────────────────────────────────────────────────
-- CONVERSATIONS (DMs)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Participants can see their conversations
CREATE POLICY conversations_select_own ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = id
      AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Any authenticated user can create a conversation
CREATE POLICY conversations_insert_auth ON conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY conversations_admin_all ON conversations
  FOR ALL USING (is_admin_or_mod());


-- ───────────────────────────────────────────────────────────────
-- CONVERSATION PARTICIPANTS
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conv_participants_conv ON conversation_participants(conversation_id);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Users can see participants of conversations they're in
CREATE POLICY conv_participants_select_own ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Users can add participants to conversations they're in
CREATE POLICY conv_participants_insert_own ON conversation_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
    OR auth.uid() IS NOT NULL
  );

-- Users can update their own participant record (for last_read_at)
CREATE POLICY conv_participants_update_own ON conversation_participants
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY conv_participants_admin_all ON conversation_participants
  FOR ALL USING (is_admin_or_mod());


-- ───────────────────────────────────────────────────────────────
-- MESSAGES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, sender_id, read_at) WHERE read_at IS NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants can see messages in their conversations
CREATE POLICY messages_select_own ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Participants can send messages in their conversations
CREATE POLICY messages_insert_own ON messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Participants can update messages (for read receipts)
CREATE POLICY messages_update_own ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY messages_admin_all ON messages
  FOR ALL USING (is_admin_or_mod());


-- ───────────────────────────────────────────────────────────────
-- HELPER: Auto-update conversation timestamp on new message
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();


-- ───────────────────────────────────────────────────────────────
-- HELPER: Get follower/following counts
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_follow_counts(target_user_id UUID)
RETURNS TABLE(follower_count BIGINT, following_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM follows WHERE following_id = target_user_id) AS follower_count,
    (SELECT COUNT(*) FROM follows WHERE follower_id = target_user_id) AS following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ───────────────────────────────────────────────────────────────
-- HELPER: Get like count for a proof card
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_like_count(target_proof_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM likes WHERE proof_card_id = target_proof_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
