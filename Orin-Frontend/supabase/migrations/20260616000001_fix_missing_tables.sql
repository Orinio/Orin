-- ═══════════════════════════════════════════════════════════════
-- Migration: Fix Missing Tables
-- Date: 2026-06-16
-- Description: Restores all missing tables for skills, social features, and activity tracking
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. SKILLS TABLE - Skill tracking for users
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT,
  verified BOOLEAN DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_level ON skills(level);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills" ON skills
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own skills" ON skills
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own skills" ON skills
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete own skills" ON skills
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 2. PROOF_VIEWS TABLE - Track proof card views
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS proof_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id UUID NOT NULL REFERENCES proof_cards(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proof_views_proof ON proof_views(proof_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_views_owner ON proof_views(owner_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_proof_views_viewer ON proof_views(viewer_user_id);

ALTER TABLE proof_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their proof views" ON proof_views
  FOR SELECT USING (owner_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can insert proof views" ON proof_views
  FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 3. FOLLOWS TABLE - User follow/unfollow system
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see all follows" ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON follows FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = follower_id));

CREATE POLICY "Users can unfollow" ON follows FOR DELETE
  USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = follower_id));

-- Helper functions for follows
CREATE OR REPLACE FUNCTION get_follower_count(target_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE following_id = target_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM follows WHERE follower_id = target_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_following(follower UUID, following UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM follows WHERE follower_id = follower AND following_id = following
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════
-- 4. POSTS TABLE - Social posts (separate from proof cards)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]'::jsonb,
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'link', 'repost', 'article')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  reply_to_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  repost_of_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  hashtags TEXT[] DEFAULT '{}',
  mentions UUID[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_mentions ON posts USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_posts_reply_to ON posts(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_repost_of ON posts(repost_of_id) WHERE repost_of_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NOT NULL;

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public posts" ON posts
  FOR SELECT USING (
    deleted_at IS NULL AND
    (
      visibility = 'public' OR
      (visibility = 'followers' AND EXISTS (
        SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = posts.user_id
      )) OR
      user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- 5. POST_REACTIONS TABLE - Reactions on posts
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'celebrate', 'insightful', 'funny')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON post_reactions(reaction_type);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own reactions" ON post_reactions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own reactions" ON post_reactions
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 6. BOOKMARKS TABLE - Save posts for later
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON bookmarks(post_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 7. POST_COMMENTS TABLE - Threaded comments on posts
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  reply_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_comments_deleted_at ON post_comments(deleted_at) WHERE deleted_at IS NOT NULL;

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments" ON post_comments
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can insert own comments" ON post_comments
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update own comments" ON post_comments
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own comments" ON post_comments
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 8. COMMENT_REACTIONS TABLE - Reactions on comments
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'insightful', 'funny')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comment reactions" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment reactions" ON comment_reactions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own comment reactions" ON comment_reactions
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 9. SOCIAL_NOTIFICATIONS TABLE - Notifications for social interactions
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'comment', 'follow', 'mention', 'repost', 'bookmark')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'user')),
  entity_id UUID NOT NULL,
  entity_preview TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_notifications_unread ON social_notifications(user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_social_notifications_actor ON social_notifications(actor_id);

ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON social_notifications
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update own notifications" ON social_notifications
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════
-- 10. USER_ACTIVITIES TABLE - Activity feed
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('post', 'comment', 'like', 'follow', 'achievement', 'share')),
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities" ON user_activities FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS AND HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_reactions' THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'bookmarks' THEN
      UPDATE posts SET bookmark_count = bookmark_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'post_reactions' THEN
      UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'bookmarks' THEN
      UPDATE posts SET bookmark_count = GREATEST(bookmark_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for post counts
DROP TRIGGER IF EXISTS trigger_post_like_count ON post_reactions;
CREATE TRIGGER trigger_post_like_count
  AFTER INSERT OR DELETE ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS trigger_post_comment_count ON post_comments;
CREATE TRIGGER trigger_post_comment_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS trigger_post_bookmark_count ON bookmarks;
CREATE TRIGGER trigger_post_bookmark_count
  AFTER INSERT OR DELETE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Function to create social notifications
CREATE OR REPLACE FUNCTION create_social_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'post_reactions' AND NEW.reaction_type = 'like' THEN
      INSERT INTO social_notifications (user_id, actor_id, action_type, entity_type, entity_id)
      SELECT p.user_id, NEW.user_id, 'like', 'post', NEW.post_id
      FROM posts p WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
    ELSIF TG_TABLE_NAME = 'post_comments' THEN
      INSERT INTO social_notifications (user_id, actor_id, action_type, entity_type, entity_id, entity_preview)
      SELECT p.user_id, NEW.user_id, 'comment', 'post', NEW.post_id, LEFT(NEW.content, 100)
      FROM posts p WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
    ELSIF TG_TABLE_NAME = 'follows' THEN
      INSERT INTO social_notifications (user_id, actor_id, action_type, entity_type, entity_id)
      VALUES (NEW.following_id, NEW.follower_id, 'follow', 'user', NEW.follower_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for notifications
DROP TRIGGER IF EXISTS trigger_post_like_notification ON post_reactions;
CREATE TRIGGER trigger_post_like_notification
  AFTER INSERT ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION create_social_notification();

DROP TRIGGER IF EXISTS trigger_post_comment_notification ON post_comments;
CREATE TRIGGER trigger_post_comment_notification
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION create_social_notification();

DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_social_notification();

-- Helper functions for social features
CREATE OR REPLACE FUNCTION get_like_count(target_proof_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM likes WHERE proof_card_id = target_proof_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_liked(target_user_id UUID, target_proof_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM likes WHERE user_id = target_user_id AND proof_card_id = target_proof_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_comment_count(target_proof_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM comments WHERE proof_card_id = target_proof_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to update proof view count
CREATE OR REPLACE FUNCTION increment_proof_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proof_cards SET view_count = view_count + 1 WHERE id = NEW.proof_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_proof_view ON proof_views;
CREATE TRIGGER trigger_increment_proof_view
  AFTER INSERT ON proof_views
  FOR EACH ROW EXECUTE FUNCTION increment_proof_view_count();
