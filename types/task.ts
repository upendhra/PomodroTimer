export interface ProjectStats {
  projectId: string;
  dailyGoals: {
    tasksPerDay: number;
    sessionsPerDay: number;
    hoursPerDay: number;
  };
  weeklyGoals: {
    tasksPerWeek: number;
    sessionsPerWeek: number;
    hoursPerWeek: number;
  };
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  totalSessionsCompleted: number;
  totalHoursWorked: number;
  focused_alerts?: number;
  deviated_alerts?: number;
  lastActiveDate: string | null;
}

export interface DailyAchievements {
  id?: string;
  project_id: string;
  date: string;
  user_id?: string | null;
  focus_sessions?: number;
  current_streak?: number;
  longest_streak?: number;
  tasks_completed?: number;
  tasks_created?: number;
  planned_hours?: number;
  completed_hours?: number;
  total_session_time?: number;
  break_sessions?: number;
  focused_alerts?: number;
  deviated_alerts?: number;
  created_at?: string;
  updated_at?: string;
}