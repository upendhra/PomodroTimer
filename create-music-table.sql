-- Create music table if it doesn't exist
CREATE TABLE IF NOT EXISTS music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  author TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on music table
ALTER TABLE music ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all operations for music" ON music;

-- Create policy that allows all CRUD operations for anonymous users
-- This matches the pattern used for tasks table
CREATE POLICY "Allow all operations for music" ON music
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_created_at ON music (created_at DESC);
