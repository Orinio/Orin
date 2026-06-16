-- Social posts system for full social media features
-- Migration: 20260616000000_social_posts.sql

-- Create posts table (separate from proof cards for general social content)
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

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_mentions ON posts USING GIN(mentions);
CREATE INDEX IF NOT EXISTS idx_posts_reply_to ON posts(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_repost_of ON posts(repost_of_id) WHERE repost_of_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NOT NULL;

-- Post reactions (beyond just likes)
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

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON bookmarks(post_id);

-- Enhanced comments with threading support
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

-- Comment reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'insightful', 'funny')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

-- User follows (already exists, but adding indexes if needed)
-- follows table already exists in schema

-- Notifications for social interactions
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

-- User activity feed
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

-- RLS policies for posts
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

-- RLS for post_reactions
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own reactions" ON post_reactions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own reactions" ON post_reactions
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS for bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS for post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments" ON post_comments
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Users can insert own comments" ON post_comments
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update own comments" ON post_comments
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own comments" ON post_comments
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS for comment_reactions
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comment reactions" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own comment reactions" ON comment_reactions
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can delete own comment reactions" ON comment_reactions
  FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS for social_notifications
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON social_notifications
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can update own notifications" ON social_notifications
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RLS for user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities" ON user_activities
  FOR SELECT USING (true);

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
CREATE TRIGGER trigger_post_like_count
  AFTER INSERT OR DELETE ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER trigger_post_comment_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

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
CREATE TRIGGER trigger_post_like_notification
  AFTER INSERT ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION create_social_notification();

CREATE TRIGGER trigger_post_comment_notification
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION create_social_notification();

CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_social_notification();
