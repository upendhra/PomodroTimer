import { createClient } from '@/lib/supabase/client';
import {
  DailyAchievementRecord,
  RecentSession,
  WeeklyReport,
  MonthlyReport,
  YearlyReport
} from '@/components/playarea/types';

const supabase = createClient();

export class DailyStatsService {
  /**
   * Record a task completion in daily achievements
   */
  static async recordTaskCompletion(
    projectId: string,
    taskDuration: number, // minutes
    actualDuration?: number // minutes
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.rpc('record_task_completion', {
      p_project_id: projectId,
      p_date: today,
      p_task_duration: taskDuration,
      p_actual_duration: actualDuration || taskDuration
    });

    if (error) {
      console.error('Failed to record task completion:', error);
      throw error;
    }
  }

  /**
   * Record a session completion
   */
  static async recordSession(
    projectId: string,
    session: Omit<RecentSession, 'id' | 'project_id' | 'created_at'>
  ): Promise<void> {
    const { error } = await supabase
      .from('recent_sessions')
      .insert({
        project_id: projectId,
        ...session
      });

    if (error) {
      console.error('Failed to record session:', error);
      throw error;
    }

    // Also update daily achievements
    await this.updateDailyAchievements(projectId, session.date, {
      [session.session_type === 'focus' ? 'focus_sessions' : 'break_sessions']:
        session.session_type === 'focus' ? 1 : 1,
      total_session_time: session.session_type === 'focus' ? session.duration_minutes : 0
    });
  }

  /**
   * Record task creation
   */
  static async recordTaskCreation(
    projectId: string,
    taskDuration: number // minutes
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.updateDailyAchievements(projectId, today, {
      tasks_created: 1,
      planned_hours: taskDuration / 60 // Convert to hours
    });
  }

  /**
   * Update daily achievements
   */
  static async updateDailyAchievements(
    projectId: string,
    date: string,
    updates: Partial<Omit<DailyAchievementRecord, 'id' | 'project_id' | 'date' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('daily_achievements')
      .upsert({
        project_id: projectId,
        date,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,date'
      });

    if (error) {
      console.error('Failed to update daily achievements:', error);
      throw error;
    }
  }

  /**
   * Check if user can create more tasks today (10 limit)
   */
  static async canCreateTaskToday(projectId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('can_create_task_today', {
      p_project_id: projectId
    });

    if (error) {
      console.error('Failed to check task limit:', error);
      return false;
    }

    return data;
  }

  /**
   * Get weekly report
   */
  static async getWeeklyReport(
    projectId: string,
    weekStart?: string
  ): Promise<WeeklyReport | null> {
    const params: any = { projectId };
    if (weekStart) params.startDate = weekStart;

    const response = await fetch(`/api/reports?type=weekly&projectId=${projectId}${
      weekStart ? `&startDate=${weekStart}` : ''
    }`);

    if (!response.ok) throw new Error('Failed to fetch weekly report');

    const data = await response.json();
    return data.report;
  }

  /**
   * Get monthly report
   */
  static async getMonthlyReport(
    projectId: string,
    monthStart?: string
  ): Promise<MonthlyReport | null> {
    const response = await fetch(`/api/reports?type=monthly&projectId=${projectId}${
      monthStart ? `&startDate=${monthStart}` : ''
    }`);

    if (!response.ok) throw new Error('Failed to fetch monthly report');

    const data = await response.json();
    return data.report;
  }

  /**
   * Get yearly report
   */
  static async getYearlyReport(
    projectId: string,
    yearStart?: string
  ): Promise<YearlyReport | null> {
    const response = await fetch(`/api/reports?type=yearly&projectId=${projectId}${
      yearStart ? `&startDate=${yearStart}` : ''
    }`);

    if (!response.ok) throw new Error('Failed to fetch yearly report');

    const data = await response.json();
    return data.report;
  }

  /**
   * Run daily maintenance (archive old data)
   */
  static async runDailyMaintenance(): Promise<{ archivedTasks: number; archivedSessions: number }> {
    const { data, error } = await supabase.rpc('daily_maintenance');

    if (error) {
      console.error('Failed to run daily maintenance:', error);
      throw error;
    }

    return data[0];
  }

  /**
   * Get recent sessions for detailed time tracking
   */
  static async getRecentSessions(
    projectId: string,
    limit = 50
  ): Promise<RecentSession[]> {
    const { data, error } = await supabase
      .from('recent_sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent sessions:', error);
      throw error;
    }

    return data || [];
  }
}
