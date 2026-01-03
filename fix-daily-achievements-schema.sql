-- Fix daily_achievements table schema to support upsert properly
-- This script safely updates the schema to allow anonymous usage

-- Step 1: Check if table exists and has data
DO $$
BEGIN
    -- If table has data, we need to be careful
    IF EXISTS (SELECT 1 FROM daily_achievements LIMIT 1) THEN
        RAISE NOTICE 'Table has existing data, will preserve it';
    END IF;
END $$;

-- Step 2: Make user_id nullable (if not already)
ALTER TABLE daily_achievements ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE recent_sessions ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Drop ALL existing unique constraints
DO $$
BEGIN
    -- Drop user_id constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'daily_achievements_user_id_project_id_date_key'
        AND table_name = 'daily_achievements'
    ) THEN
        ALTER TABLE daily_achievements DROP CONSTRAINT daily_achievements_user_id_project_id_date_key;
        RAISE NOTICE 'Dropped constraint: daily_achievements_user_id_project_id_date_key';
    END IF;

    -- Drop old project_id constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'daily_achievements_project_id_date_key'
        AND table_name = 'daily_achievements'
    ) THEN
        ALTER TABLE daily_achievements DROP CONSTRAINT daily_achievements_project_id_date_key;
        RAISE NOTICE 'Dropped constraint: daily_achievements_project_id_date_key';
    END IF;

    -- Drop project_date constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'daily_achievements_project_date_key'
        AND table_name = 'daily_achievements'
    ) THEN
        ALTER TABLE daily_achievements DROP CONSTRAINT daily_achievements_project_date_key;
        RAISE NOTICE 'Dropped constraint: daily_achievements_project_date_key';
    END IF;
END $$;

-- Step 4: Add the correct unique constraint for anonymous usage
ALTER TABLE daily_achievements 
ADD CONSTRAINT daily_achievements_project_date_unique 
UNIQUE (project_id, date);

-- Step 5: Update RLS policies to allow anonymous access
ALTER TABLE daily_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_sessions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can access their project achievements" ON daily_achievements;
DROP POLICY IF EXISTS "Users can access their project sessions" ON recent_sessions;
DROP POLICY IF EXISTS "Allow anonymous access to daily achievements" ON daily_achievements;
DROP POLICY IF EXISTS "Allow anonymous access to sessions" ON recent_sessions;

-- Create permissive policies that allow all access
CREATE POLICY "Allow all access to daily achievements" ON daily_achievements
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sessions" ON recent_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Step 6: Verify the changes
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE table_name = 'daily_achievements'
    AND constraint_type = 'UNIQUE';
    
    RAISE NOTICE 'Total unique constraints on daily_achievements: %', constraint_count;
    
    -- Show all constraints
    FOR constraint_count IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints
        WHERE table_name = 'daily_achievements'
        AND constraint_type = 'UNIQUE'
    LOOP
        RAISE NOTICE 'Constraint: %', constraint_count;
    END LOOP;
END $$;

SELECT 'Schema update completed successfully!' AS status;
