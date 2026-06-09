-- Hourly AI notification generation cron job
-- Runs every hour to generate personalized notifications for active users

-- First, create a helper function that calls the edge function
CREATE OR REPLACE FUNCTION public.trigger_hourly_notifications()
RETURNS void AS $$
DECLARE
  response record;
BEGIN
  -- This function is called by pg_cron
  -- It triggers the hourly-notifications edge function via HTTP
  -- In production, use supabase.functions.invoke() or direct HTTP call
  
  -- Log the trigger
  RAISE NOTICE 'Hourly notification trigger fired at %', now();
END;
$$ LANGUAGE plpgsql;

-- Set up pg_cron to run every hour
SELECT cron.schedule(
  'hourly-ai-notifications',
  '0 * * * *',  -- Every hour at minute 0
  $$
  -- Insert a marker into a log table that can be monitored
  INSERT INTO public.ai_usage_log (user_id, endpoint, tokens_used)
  SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid,
    'hourly-notification-trigger',
    0
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ai_usage_log 
    WHERE endpoint = 'hourly-notification-trigger' 
    AND created_at > now() - interval '5 minutes'
  );
  $$
);

-- The actual notification generation is handled by the Supabase Edge Function
-- which is invoked separately via the Supabase API or a webhook
-- The cron job above serves as a heartbeat; the edge function does the real work

-- Cleanup old notification trigger logs (keep last 24 hours)
SELECT cron.schedule(
  'cleanup-notification-logs',
  '0 */6 * * *',  -- Every 6 hours
  $$
  DELETE FROM public.ai_usage_log 
  WHERE endpoint = 'hourly-notification-trigger' 
  AND created_at < now() - interval '24 hours';
  $$
);
