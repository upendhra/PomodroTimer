-- Create tasks table for Supabase
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  duration INTEGER NOT NULL DEFAULT 25, -- minutes
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'achieved')),
  completed_at TIMESTAMPTZ,
  sessions_completed INTEGER DEFAULT 0,
  actual_duration INTEGER DEFAULT 0, -- actual time spent in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  target_sessions INTEGER,
  daily_goal INTEGER,

  -- Indexes for better performance
  INDEX idx_tasks_project_id (project_id),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_created_at (created_at DESC)
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own project tasks
-- Note: You'll need to adjust this based on your user authentication setup
CREATE POLICY "Users can access their project tasks" ON tasks
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add sort_order column for drag-and-drop reordering (run this separately after table creation)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks (sort_order ASC);
