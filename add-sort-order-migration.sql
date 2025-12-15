-- Migration: Add sort_order column and backfill existing tasks
-- Run this in your Supabase SQL editor to add drag-and-drop ordering support

-- Step 1: Add the sort_order column with default value
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks (sort_order ASC);

-- Step 3: Backfill existing TO DO tasks with sort_order values based on created_at
-- This ensures existing tasks maintain their relative order within each project
UPDATE tasks SET sort_order = sub.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY project_id, status
    ORDER BY created_at ASC
  ) as row_number
  FROM tasks
  WHERE status = 'todo'
) sub
WHERE tasks.id = sub.id AND tasks.status = 'todo';

-- Step 4: Set sort_order to NULL for non-todo tasks (they don't participate in drag-and-drop)
UPDATE tasks SET sort_order = NULL WHERE status != 'todo';

-- Verify the migration worked (run this query to check)
-- SELECT id, title, status, sort_order, created_at, project_id
-- FROM tasks
-- WHERE project_id = 'your-project-id-here'
-- ORDER BY COALESCE(sort_order, 999999) ASC, created_at ASC;
