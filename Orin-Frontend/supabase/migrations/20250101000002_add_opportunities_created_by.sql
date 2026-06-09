-- Add created_by to opportunities for employer portal
-- Migration: 20250101000002_add_opportunities_created_by.sql

ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);

-- Allow employers to manage their own opportunities
ALTER POLICY "Allow public read access to opportunities" ON opportunities USING (true);

-- Employers can insert their own opportunities
CREATE POLICY "Employers can create opportunities"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = created_by
  ));

-- Employers can update their own opportunities
CREATE POLICY "Employers can update own opportunities"
  ON opportunities FOR UPDATE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = created_by
  ));

-- Employers can delete their own opportunities
CREATE POLICY "Employers can delete own opportunities"
  ON opportunities FOR DELETE
  USING (auth.uid() = (
    SELECT auth_user_id FROM users WHERE id = created_by
  ));
