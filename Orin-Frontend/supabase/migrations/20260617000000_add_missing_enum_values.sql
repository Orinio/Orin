-- Add missing enum values for role-based access control
-- These are needed for the unified dashboard with RBAC

-- Add 'university' to subscription_plan enum
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'university';

-- Add 'employer' and 'university' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'university';

-- Note: These enums already exist in the live DB.
-- This migration documents the changes for schema.json sync.
