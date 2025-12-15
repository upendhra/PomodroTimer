-- API Endpoints for Reports (add to app/api/reports/route.ts)

-- Weekly Report Query
CREATE OR REPLACE FUNCTION get_weekly_report(
  p_project_id UUID,
  p_week_start DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE
)
RETURNS TABLE (
  week_start DATE,
  total_tasks_created BIGINT,
  total_tasks_completed BIGINT,
  total_focus_sessions BIGINT,
  total_break_sessions BIGINT,
  total_planned_hours DECIMAL,
  total_completed_hours DECIMAL,
  avg_daily_streak DECIMAL,
  best_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_week_start as week_start,
    COALESCE(SUM(tasks_created), 0) as total_tasks_created,
    COALESCE(SUM(tasks_completed), 0) as total_tasks_completed,
    COALESCE(SUM(focus_sessions), 0) as total_focus_sessions,
    COALESCE(SUM(break_sessions), 0) as total_break_sessions,
    COALESCE(SUM(planned_hours), 0) as total_planned_hours,
    COALESCE(SUM(completed_hours), 0) as total_completed_hours,
    ROUND(COALESCE(AVG(current_streak), 0), 1) as avg_daily_streak,
    COALESCE(MAX(longest_streak), 0) as best_streak
  FROM daily_achievements
  WHERE project_id = p_project_id
  AND date >= p_week_start
  AND date < p_week_start + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Monthly Report Query
CREATE OR REPLACE FUNCTION get_monthly_report(
  p_project_id UUID,
  p_month_start DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE
)
RETURNS TABLE (
  month_start DATE,
  total_tasks_created BIGINT,
  total_tasks_completed BIGINT,
  total_focus_sessions BIGINT,
  total_break_sessions BIGINT,
  total_planned_hours DECIMAL,
  total_completed_hours DECIMAL,
  avg_daily_streak DECIMAL,
  best_streak INTEGER,
  active_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_month_start as month_start,
    COALESCE(SUM(tasks_created), 0) as total_tasks_created,
    COALESCE(SUM(tasks_completed), 0) as total_tasks_completed,
    COALESCE(SUM(focus_sessions), 0) as total_focus_sessions,
    COALESCE(SUM(break_sessions), 0) as total_break_sessions,
    COALESCE(SUM(planned_hours), 0) as total_planned_hours,
    COALESCE(SUM(completed_hours), 0) as total_completed_hours,
    ROUND(COALESCE(AVG(current_streak), 0), 1) as avg_daily_streak,
    COALESCE(MAX(longest_streak), 0) as best_streak,
    COUNT(*) as active_days
  FROM daily_achievements
  WHERE project_id = p_project_id
  AND date >= p_month_start
  AND date < p_month_start + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Yearly Report Query
CREATE OR REPLACE FUNCTION get_yearly_report(
  p_project_id UUID,
  p_year_start DATE DEFAULT DATE_TRUNC('year', CURRENT_DATE)::DATE
)
RETURNS TABLE (
  year_start DATE,
  total_tasks_created BIGINT,
  total_tasks_completed BIGINT,
  total_focus_sessions BIGINT,
  total_break_sessions BIGINT,
  total_planned_hours DECIMAL,
  total_completed_hours DECIMAL,
  avg_daily_streak DECIMAL,
  best_streak INTEGER,
  active_days INTEGER,
  completion_rate DECIMAL
) AS $$
DECLARE
  total_created BIGINT;
  total_completed BIGINT;
BEGIN
  SELECT
    COALESCE(SUM(tasks_created), 0),
    COALESCE(SUM(tasks_completed), 0)
  INTO total_created, total_completed
  FROM daily_achievements
  WHERE project_id = p_project_id
  AND date >= p_year_start
  AND date < p_year_start + INTERVAL '1 year';

  RETURN QUERY
  SELECT
    p_year_start as year_start,
    total_created as total_tasks_created,
    total_completed as total_tasks_completed,
    COALESCE(SUM(focus_sessions), 0) as total_focus_sessions,
    COALESCE(SUM(break_sessions), 0) as total_break_sessions,
    COALESCE(SUM(planned_hours), 0) as total_planned_hours,
    COALESCE(SUM(completed_hours), 0) as total_completed_hours,
    ROUND(COALESCE(AVG(current_streak), 0), 1) as avg_daily_streak,
    COALESCE(MAX(longest_streak), 0) as best_streak,
    COUNT(*) as active_days,
    CASE WHEN total_created > 0 THEN ROUND((total_completed::DECIMAL / total_created) * 100, 1) ELSE 0 END as completion_rate
  FROM daily_achievements
  WHERE project_id = p_project_id
  AND date >= p_year_start
  AND date < p_year_start + INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Daily task creation limit check (for API)
CREATE OR REPLACE FUNCTION can_create_task_today(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_daily_task_limit(p_project_id, CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;
