-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations for anon users" ON tasks;

-- Create policy that allows all CRUD operations for anonymous users
-- This is for MVP/prototype - in production you'd want proper auth
CREATE POLICY "Allow all operations for anon users" ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);
