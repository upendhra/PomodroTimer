-- Daily Achievements - Core aggregated stats (permanent storage)
CREATE TABLE IF NOT EXISTS daily_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  date DATE NOT NULL,

  -- Task metrics (preserved even if tasks deleted)
  tasks_created INTEGER DEFAULT 0,        -- Total tasks planned/added that day
  tasks_completed INTEGER DEFAULT 0,      -- Tasks marked as complete
  planned_hours DECIMAL(5,2) DEFAULT 0,   -- Total planned duration of tasks created
  completed_hours DECIMAL(5,2) DEFAULT 0, -- Actual time spent on completed tasks

  -- Session metrics
  focus_sessions INTEGER DEFAULT 0,       -- Number of focus sessions completed
  break_sessions INTEGER DEFAULT 0,       -- Number of break sessions completed
  total_session_time INTEGER DEFAULT 0,   -- Total session time in minutes

  -- Achievement tracking
  current_streak INTEGER DEFAULT 0,       -- Streak at end of day
  longest_streak INTEGER DEFAULT 0,       -- Longest streak up to this day

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, date),

  -- Indexes
  INDEX idx_daily_achievements_project_date (project_id, date DESC),
  INDEX idx_daily_achievements_date (date DESC)
);

-- Recent Sessions - Detailed time tracking (keep last 7 days)
CREATE TABLE IF NOT EXISTS recent_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  task_id UUID,                          -- NULL for breaks or when task deleted
  task_title TEXT,                       -- Preserve task name even if deleted

  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,

  session_type TEXT NOT NULL CHECK (session_type IN ('focus', 'short_break', 'long_break')),
  completed BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_recent_sessions_project_date (project_id, date DESC),
  INDEX idx_recent_sessions_date (date DESC)
);

-- Tasks table (keep only recent - last 7 days active, archive older)
-- Add archive_after field to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS archive_after DATE;

-- Enable RLS
ALTER TABLE daily_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their project achievements" ON daily_achievements
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their project sessions" ON recent_sessions
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Updated trigger for daily_achievements
CREATE TRIGGER update_daily_achievements_updated_at
  BEFORE UPDATE ON daily_achievements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
