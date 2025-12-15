-- Fix RLS policies for tasks table to properly allow all operations
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can access their project tasks" ON tasks;

-- Create comprehensive policy for all operations
CREATE POLICY "Users can manage their project tasks" ON tasks
  FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Also ensure we can insert tasks for our projects
CREATE POLICY "Users can create tasks for their projects" ON tasks
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
