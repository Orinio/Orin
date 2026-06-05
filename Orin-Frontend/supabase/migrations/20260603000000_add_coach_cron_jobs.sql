-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to generate weekly coach notes for active users
CREATE OR REPLACE FUNCTION generate_weekly_coach_notes()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  openai_api_key TEXT;
  response JSONB;
BEGIN
  -- Get OpenAI API key from vault (if using Supabase Vault)
  -- For now, we'll use a placeholder - in production, store this in Supabase Vault
  openai_api_key := current_setting('app.settings.openai_api_key', true);
  
  -- Loop through active users (logged in within last 30 days)
  FOR user_record IN 
    SELECT u.id, u.auth_user_id, u.full_name, u.username, u.college, u.year
    FROM users u
    WHERE u.account_status = 'active'
    AND u.last_login_at > NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      -- Don't generate if user already has a weekly note from this week
      SELECT 1 FROM coach_notes cn
      WHERE cn.user_id = u.id
      AND cn.type = 'weekly'
      AND cn.created_at > NOW() - INTERVAL '7 days'
      AND cn.deleted_at IS NULL
    )
  LOOP
    -- Insert a placeholder weekly note
    -- In production, this would call the Edge Function or OpenAI API directly
    INSERT INTO coach_notes (user_id, type, content, action_label, action_url, priority, expires_at)
    VALUES (
      user_record.id,
      'weekly',
      'Weekly Summary: Keep building your portfolio! Add more proofs and skills to get personalized career advice.',
      'View Dashboard',
      '/dashboard',
      6,
      NOW() + INTERVAL '7 days'
    );
    
    -- Log the generation
    RAISE NOTICE 'Generated weekly note for user: %', user_record.username;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run every Monday at 9 AM UTC
SELECT cron.schedule(
  'generate-weekly-coach-notes',
  '0 9 * * 1',  -- Every Monday at 9:00 UTC
  $$SELECT generate_weekly_coach_notes();$$
);

-- Create a function to clean up expired coach notes
CREATE OR REPLACE FUNCTION cleanup_expired_coach_notes()
RETURNS void AS $$
BEGIN
  -- Soft delete expired notes
  UPDATE coach_notes
  SET deleted_at = NOW()
  WHERE expires_at < NOW()
  AND deleted_at IS NULL;
  
  -- Log cleanup
  RAISE NOTICE 'Cleaned up expired coach notes at: %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily at midnight UTC
SELECT cron.schedule(
  'cleanup-expired-coach-notes',
  '0 0 * * *',  -- Every day at midnight UTC
  $$SELECT cleanup_expired_coach_notes();$$
);

-- Create a function to generate daily tips for highly active users
CREATE OR REPLACE FUNCTION generate_daily_tips()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Only generate for users who logged in today and have proofs
  FOR user_record IN 
    SELECT u.id, u.username
    FROM users u
    WHERE u.account_status = 'active'
    AND u.last_login_at::date = CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM coach_notes cn
      WHERE cn.user_id = u.id
      AND cn.type = 'daily'
      AND cn.created_at::date = CURRENT_DATE
      AND cn.deleted_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM proof_cards pc
      WHERE pc.user_id = u.id
      AND pc.deleted_at IS NULL
    )
  LOOP
    INSERT INTO coach_notes (user_id, type, content, action_label, action_url, priority, expires_at)
    VALUES (
      user_record.id,
      'daily',
      'Daily Tip: Review your proof cards and make sure they have clear descriptions of what they prove about your skills.',
      'View Proofs',
      '/dashboard',
      4,
      NOW() + INTERVAL '1 day'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily tips to run at 10 AM UTC
SELECT cron.schedule(
  'generate-daily-tips',
  '0 10 * * *',  -- Every day at 10:00 UTC
  $$SELECT generate_daily_tips();$$
);
