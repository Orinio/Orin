-- Prevent users from self-promoting to admin/moderator
-- Only allows: user, employer, university (self-serve)
-- Admin/mod roles require admin auth (existing admin-dev endpoints use service_role key)

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  allowed_self_roles text[] := ARRAY['user', 'employer', 'university'];
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT (NEW.role = ANY(allowed_self_roles)) THEN
      -- Allow if called from service role (admin endpoints use service_role key)
      IF current_setting('request.jwt.claims', true) IS NOT NULL
         AND (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') THEN
        RETURN NEW;
      ELSE
        RAISE EXCEPTION 'Cannot self-promote to role: %. Allowed self-serve roles: user, employer, university', NEW.role;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS check_role_change ON public.users;
CREATE TRIGGER check_role_change
  BEFORE UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();
