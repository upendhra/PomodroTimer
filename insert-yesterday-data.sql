-- Insert yesterday's data (Dec 20, 2025) to separate yesterday from today
INSERT INTO daily_achievements (
  user_id,
  project_id,
  date,
  focus_sessions,
  current_streak,
  longest_streak,
  tasks_completed,
  tasks_created,
  planned_hours,
  completed_hours,
  total_session_time,
  break_sessions
) VALUES (
  null,  -- user_id (null for anonymous)
  'b94264e1-7c37-465c-80ca-ff20e6202b10',  -- your project_id
  '2025-12-20',  -- yesterday's date
  3,  -- focus_sessions
  2,  -- current_streak
  4,  -- longest_streak
  2,  -- tasks_completed
  3,  -- tasks_created
  2.0,  -- planned_hours
  1.5,  -- completed_hours
  75,  -- total_session_time (minutes)
  2   -- break_sessions
);

-- Insert some sample session records for yesterday
INSERT INTO recent_sessions (
  user_id,
  project_id,
  task_id,
  task_title,
  date,
  start_time,
  end_time,
  duration_minutes,
  session_type,
  completed
) VALUES
(null, 'b94264e1-7c37-465c-80ca-ff20e6202b10', null, 'Sample Task 1', '2025-12-20', '2025-12-20T09:00:00Z', '2025-12-20T09:25:00Z', 25, 'focus', true),
(null, 'b94264e1-7c37-465c-80ca-ff20e6202b10', null, 'Sample Task 2', '2025-12-20', '2025-12-20T09:35:00Z', '2025-12-20T10:00:00Z', 25, 'focus', true);
