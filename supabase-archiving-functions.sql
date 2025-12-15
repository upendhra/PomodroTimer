-- Archiving Functions for Free Tier Optimization

-- Function to archive old tasks (older than 7 days) into daily achievements
CREATE OR REPLACE FUNCTION archive_old_tasks()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
  old_task RECORD;
BEGIN
  -- Process each old completed task
  FOR old_task IN
    SELECT * FROM tasks
    WHERE status = 'todo' AND completed_at IS NOT NULL
    AND completed_at < CURRENT_DATE - INTERVAL '7 days'
    AND archive_after IS NULL
  LOOP
    -- Update daily achievements with this task's data
    INSERT INTO daily_achievements (
      project_id, date, tasks_completed, completed_hours, planned_hours
    ) VALUES (
      old_task.project_id,
      DATE(old_task.completed_at),
      1,
      COALESCE(old_task.actual_duration, old_task.duration) / 60.0,
      old_task.duration / 60.0
    )
    ON CONFLICT (project_id, date)
    DO UPDATE SET
      tasks_completed = daily_achievements.tasks_completed + 1,
      completed_hours = daily_achievements.completed_hours + (COALESCE(old_task.actual_duration, old_task.duration) / 60.0),
      planned_hours = daily_achievements.planned_hours + (old_task.duration / 60.0),
      updated_at = NOW();

    -- Mark task for deletion
    UPDATE tasks SET archive_after = CURRENT_DATE WHERE id = old_task.id;
    archived_count := archived_count + 1;
  END LOOP;

  -- Actually delete archived tasks (optional - or keep them for reference)
  -- DELETE FROM tasks WHERE archive_after IS NOT NULL AND archive_after < CURRENT_DATE - INTERVAL '30 days';

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old sessions (older than 7 days) into daily achievements
CREATE OR REPLACE FUNCTION archive_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER := 0;
  session_summary RECORD;
BEGIN
  -- Aggregate old sessions by project, date, and type
  FOR session_summary IN
    SELECT
      project_id,
      DATE(start_time) as session_date,
      session_type,
      COUNT(*) as session_count,
      SUM(duration_minutes) as total_minutes
    FROM recent_sessions
    WHERE start_time < CURRENT_DATE - INTERVAL '7 days'
    GROUP BY project_id, DATE(start_time), session_type
  LOOP
    -- Update daily achievements
    IF session_summary.session_type = 'focus' THEN
      UPDATE daily_achievements
      SET focus_sessions = focus_sessions + session_summary.session_count,
          total_session_time = total_session_time + session_summary.total_minutes,
          updated_at = NOW()
      WHERE project_id = session_summary.project_id
      AND date = session_summary.session_date;
    ELSE
      UPDATE daily_achievements
      SET break_sessions = break_sessions + session_summary.session_count,
          updated_at = NOW()
      WHERE project_id = session_summary.project_id
      AND date = session_summary.session_date;
    END IF;

    -- If no daily_achievements record exists, create one
    IF NOT FOUND THEN
      INSERT INTO daily_achievements (
        project_id, date,
        focus_sessions, break_sessions, total_session_time
      ) VALUES (
        session_summary.project_id,
        session_summary.session_date,
        CASE WHEN session_summary.session_type = 'focus' THEN session_summary.session_count ELSE 0 END,
        CASE WHEN session_summary.session_type != 'focus' THEN session_summary.session_count ELSE 0 END,
        CASE WHEN session_summary.session_type = 'focus' THEN session_summary.total_minutes ELSE 0 END
      );
    END IF;

    archived_count := archived_count + session_summary.session_count;
  END LOOP;

  -- Delete archived sessions
  DELETE FROM recent_sessions
  WHERE start_time < CURRENT_DATE - INTERVAL '7 days';

  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce daily task creation limit (10 per day)
CREATE OR REPLACE FUNCTION check_daily_task_limit(
  p_project_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  task_count INTEGER;
BEGIN
  -- Count tasks created today
  SELECT COUNT(*) INTO task_count
  FROM tasks
  WHERE project_id = p_project_id
  AND DATE(created_at) = p_date;

  -- Also count from daily_achievements if it exists
  SELECT task_count + COALESCE(da.tasks_created, 0) INTO task_count
  FROM (SELECT task_count) t
  LEFT JOIN daily_achievements da ON da.project_id = p_project_id AND da.date = p_date;

  -- Return true if under limit
  RETURN task_count < 10;
END;
$$ LANGUAGE plpgsql;

-- Daily cleanup job (run this periodically)
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS TABLE(archived_tasks INTEGER, archived_sessions INTEGER) AS $$
DECLARE
  task_count INTEGER;
  session_count INTEGER;
BEGIN
  -- Archive old data
  SELECT archive_old_tasks() INTO task_count;
  SELECT archive_old_sessions() INTO session_count;

  -- Clean up very old archived tasks (keep 90 days of archived data)
  DELETE FROM tasks
  WHERE archive_after IS NOT NULL
  AND archive_after < CURRENT_DATE - INTERVAL '90 days';

  RETURN QUERY SELECT task_count, session_count;
END;
$$ LANGUAGE plpgsql;
