-- ─────────────────────────────────────────────────────────────────────────────
-- ANCORALIS — Row Level Security Migration
-- Run this in Supabase > SQL Editor after backing up your data
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Drop existing permissive policies
DROP POLICY IF EXISTS "allow all" ON anchors;
DROP POLICY IF EXISTS "allow all" ON shelf_items;
DROP POLICY IF EXISTS "allow all" ON checkin_log;
DROP POLICY IF EXISTS "allow all" ON settings;

-- Step 2: Convert user_id columns from text to uuid
-- Note: This will fail if you have existing 'default' string values
-- Clear your tables first or manually update rows to use valid UUIDs

ALTER TABLE anchors ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE shelf_items ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE checkin_log ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE settings ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Step 3: Create auth-based RLS policies
-- Users can only access their own data

CREATE POLICY "Users can manage their own anchors"
  ON anchors FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shelf items"
  ON shelf_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own checkins"
  ON checkin_log FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
  ON settings FOR ALL
  USING (auth.uid() = user_id);

-- Done! RLS is now properly configured for multi-user authentication
