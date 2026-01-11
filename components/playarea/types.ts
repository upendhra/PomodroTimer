export type TaskPriority = 'high' | 'medium' | 'low';

export interface PlayTask {
  id: string;
  title: string;
  priority: TaskPriority;
  notes?: string;
  completed: boolean;
}

export type BoardTaskStatus = 'todo' | 'achieved';

export interface BoardTaskCard {
  id: string;
  title: string;
  priority: TaskPriority;
  duration: number; // minutes (planned duration)
  status: BoardTaskStatus;
  completedAt?: string | null; // ISO date string when task was completed, null when undone
  sessionsCompleted?: number; // Number of pomodoro sessions completed for this task
  actualDuration?: number | null; // Actual time spent in minutes, null when undone
  createdAt?: string; // ISO date string when task was created
  targetSessions?: number; // Target number of sessions for this task
  dailyGoal?: number; // Daily task completion goal
  sortOrder?: number; // Order for drag-and-drop sorting
  focusedAlerts?: number; // Number of "Focused" responses to stay-on-task alerts
  deviatedAlerts?: number; // Number of "Deviated" responses to stay-on-task alerts
  timerMode?: 'default' | 'customised'; // Timer mode for this task
  customFocusTime?: number; // Custom focus duration in minutes
  customShortBreak?: number; // Custom short break duration in minutes
  customLongBreak?: number; // Custom long break duration in minutes
}

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
  lastActiveDate: string | null;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  tasksCompleted: number;
  sessionsCompleted: number;
  breakSessions: number;
  hoursWorked: number;
  targetTasks: number;
  targetSessions: number;
  targetHours: number;
  achieved: boolean; // Did they meet their daily goals?
  focusedAlerts?: number; // Number of times user answered "Focused" to alerts
  deviatedAlerts?: number; // Number of times user answered "Deviated" to alerts
  breakTime?: number; // Total break time in minutes (only successful completions)
  deviationTime?: number; // Total deviation time in minutes
  focusTime?: number; // Total focus time in minutes (alert frequency when Focused selected)
}

export interface SessionRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  type: 'focus' | 'short' | 'long';
  completed: boolean;
}

export interface DailyAchievement {
  date: string; // ISO date string (YYYY-MM-DD)
  dayOfWeek: string; // e.g., 'Monday'
  tasks: BoardTaskCard[];
  totalPlannedHours: number;
  totalActualHours: number;
  totalSessions: number;
  streakDay: number; // Which day in the current streak (0 if no streak)
}

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; description: string; color: string; pillBg: string }
> = {
  high: {
    label: 'High impact',
    description: 'Protect flow-critical missions',
    color: '#f87171',
    pillBg: 'rgba(248,113,113,0.18)',
  },
  medium: {
    label: 'Medium',
    description: 'Important but flexible',
    color: '#fb923c',
    pillBg: 'rgba(251,146,60,0.18)',
  },
  low: {
    label: 'Nice to have',
    description: 'Slot into recovery time',
    color: '#34d399',
    pillBg: 'rgba(52,211,153,0.18)',
  },
};

export const priorityOrder: TaskPriority[] = ['high', 'medium', 'low'];

// Daily Achievement (aggregated stats)
export interface DailyAchievementRecord {
  id: string;
  project_id: string;
  date: string; // YYYY-MM-DD

  // Task metrics
  tasks_created: number;
  tasks_completed: number;
  planned_hours: number; // decimal hours
  completed_hours: number; // decimal hours

  // Session metrics
  focus_sessions: number;
  break_sessions: number;
  total_session_time: number; // minutes

  // Achievement tracking
  current_streak: number;
  longest_streak: number;

  created_at: string;
  updated_at: string;
}

// Recent Session (detailed tracking for last 7 days)
export interface RecentSession {
  id: string;
  project_id: string;
  task_id?: string;
  task_title?: string;

  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  duration_minutes: number;

  session_type: 'focus' | 'short_break' | 'long_break';
  completed: boolean;

  created_at: string;
}

// Report interfaces
export interface WeeklyReport {
  week_start: string;
  total_tasks_created: number;
  total_tasks_completed: number;
  total_focus_sessions: number;
  total_break_sessions: number;
  total_planned_hours: number;
  total_completed_hours: number;
  avg_daily_streak: number;
  best_streak: number;
}

export interface MonthlyReport {
  month_start: string;
  total_tasks_created: number;
  total_tasks_completed: number;
  total_focus_sessions: number;
  total_break_sessions: number;
  total_planned_hours: number;
  total_completed_hours: number;
  avg_daily_streak: number;
  best_streak: number;
  active_days: number;
}

export interface UserSettings {
  user_id: string;
  theme_id?: string;
  music_id?: string;
  quote_category?: string;
  notification_email?: boolean;
  notification_inapp?: boolean;
  notification_desktop?: boolean;
  report_frequency?: string;

  // Timer Settings
  timer_type?: 'pomodoro' | 'stopwatch' | 'countdown' | 'interval';
  pomodoro_duration_mode?: 'default' | 'customised';
  default_focus_duration?: number;
  default_short_break?: number;
  default_long_break?: number;
  countdown_minutes?: number;

  // Pomodoro Automation
  auto_start_breaks?: boolean;
  auto_start_pomodoros?: boolean;
  long_break_interval?: number;
  auto_check_tasks?: boolean;
  send_completed_to_bottom?: boolean;

  // Alert Settings
  alerts_enabled?: boolean;
  alert_frequency?: number;
  stay_on_task_repeat?: boolean;
  stay_on_task_fallback?: 'focused' | 'deviated';

  created_at?: string;
  updated_at?: string;
}
