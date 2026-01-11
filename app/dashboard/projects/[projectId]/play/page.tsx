'use client';

import { 
  ArrowLeft, 
  BarChart3,
  Bell, 
  Calendar, 
  ChevronDown,
  Eye,
  EyeOff, 
  Expand, 
  ListTodo, 
  Maximize2, 
  Minimize2, 
  Music, 
  Palette, 
  PenSquare, 
  Settings, 
  Timer, 
  TimerReset, 
  X 
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PlayAreaLayout from '@/components/playarea/PlayAreaLayout';
import TimerCircle from '@/components/playarea/TimerCircle';
import { createClient } from '@/lib/supabase/client';
import ModeTabs from '@/components/playarea/ModeTabs';
import TimerControls from '@/components/playarea/TimerControls';
import TodoTaskBoardModal from '@/components/playarea/TodoTaskBoardModal';
import { BoardTaskCard, BoardTaskStatus, PRIORITY_META, ProjectStats, DailyStats, SessionRecord } from '@/components/playarea/types';
import MediaPlayer from '@/components/project/MediaPlayer';
import ThemeDrawer, { ThemePreset } from '@/components/theme/ThemeDrawer';
import CalendarDrawer from '@/components/project/CalendarDrawer';
import QuickNoteModal from '@/components/project/QuickNoteModal';
import FocusAlertModal from '@/components/playarea/AlertModal';
import { StatsModal } from '@/components/playarea/stats/StatsModal';
import { useLocalStats } from '@/hooks/useLocalStats';

interface Project {
  id: string;
  project_name: string;
  duration_type: string;
  start_date: string | null;
  end_date: string | null;
  weekdays: string[];
  planned_hours: Record<string, number>;
}
import { alertSound } from '@/utils/alertSound';
import Toast from '@/components/playarea/Toast';

import SettingsPanel, { type TimerMode, type StayOnTaskFallback, type SettingsTabId, type PomodoroDurationMode } from '@/components/playarea/SettingsPanel';
import { useTheme } from '@/hooks/useTheme';

const MODE_CONFIG = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const DEFAULT_THEME_COLORS = {
  surface: 'rgba(2,4,12,0.95)',
  panel: 'rgba(8,11,22,0.9)',
  border: 'rgba(255,255,255,0.08)',
  chip: 'rgba(255,255,255,0.08)',
};

const MIN_TIMER_SECONDS = 30;
const MAX_TIMER_SECONDS = 90 * 60;
const formatSecondsToInput = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const formatMinutesToClock = (minutes: number) => {
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const parseClockToMinutes = (value: string) => {
  if (!value) return null;
  const parts = value.split(':');
  if (parts.length > 2) return null;
  const [minsRaw, secsRaw = '0'] = parts;
  if (minsRaw === '' && secsRaw === '') return null;
  const minutesNum = Number(minsRaw);
  const secondsNum = Number(secsRaw);
  if (Number.isNaN(minutesNum) || Number.isNaN(secondsNum) || secondsNum >= 60) return null;
  return minutesNum + secondsNum / 60;
};

const parseTimeInput = (value: string) => {
  const [mins, secs] = value.split(':');
  if (mins === undefined || secs === undefined || mins === '' || secs === '') return null;
  const minutesNum = Number(mins);
  const secondsNum = Number(secs);
  if (Number.isNaN(minutesNum) || Number.isNaN(secondsNum)) return null;
  return minutesNum * 60 + secondsNum;
};

const clampTimerSeconds = (value: number) => Math.min(MAX_TIMER_SECONDS, Math.max(MIN_TIMER_SECONDS, value));

const DAILY_POMODORO_STORAGE_KEY = 'pomodroDailyProgress';
const PROJECT_STATS_STORAGE_KEY = 'pomodroProjectStats';
const DAILY_STATS_STORAGE_KEY = 'pomodroDailyStats';
const SESSION_RECORDS_STORAGE_KEY = 'pomodroSessionRecords';

const getTodayKey = () => {
  // Use local date instead of UTC to avoid timezone issues
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localDate = `${year}-${month}-${day}`;

  console.log('📅 getTodayKey() returning local date:', localDate, 'UTC date:', now.toISOString().split('T')[0]);
  return localDate;
};

const formatPlannedMinutes = (totalMinutes: number) => {
  if (totalMinutes <= 0 || Number.isNaN(totalMinutes)) return '0m';

  if (totalMinutes < 60) {
    // Show minutes for values less than 1 hour
    return `${Math.round(totalMinutes)}m`;
  }

  // Show hours with 1 decimal for 1+ hours
  const hours = (totalMinutes / 60).toFixed(1);
  return `${hours}h`;
};

const hexToRgba = (hex: string, alpha = 1) => {
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }
  const int = parseInt(normalized, 16);
  const normalizedHex = int & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${normalizedHex}, ${g}, ${b}, ${alpha})`;
};

// NEW: Fetch recent achievements for streak calculation
const fetchRecentAchievements = async (projectId: string, days: number = 14) => {
  try {
    const response = await fetch(`/api/daily-achievements?projectId=${projectId}&days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch recent achievements');
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch recent achievements:', error);
    return [];
  }
};

// NEW: Calculate streak from full history
const calculateStreakFromHistory = async (
  projectId: string,
  todayFocusSessionsOverride?: number
) => {
  console.log('🔍 DEBUG: Starting calculateStreakFromHistory for projectId:', projectId);
  
  // 1. Fetch ALL daily_achievements sorted by date DESC
  const response = await fetch(`/api/daily-achievements?projectId=${projectId}&days=365`);
  const allDays = await response.json();

  console.log('🔍 DEBUG: API Response:', allDays);

  if (!allDays || !allDays.success || !allDays.data || allDays.data.length === 0) {
    console.log('🔍 DEBUG: No data found, returning zeros');
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 2. Filter out records with 0 focus_sessions (days without activity)
  const activeDays = allDays.data.filter((record: any) => record.focus_sessions > 0);
  
  // 3. Sort by date ascending (oldest first)
  const sorted = activeDays.sort((a: any, b: any) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  console.log('🔍 DEBUG: Total records (all):', allDays.data.length);
  console.log('🔍 DEBUG: Active days (focus_sessions > 0):', sorted.length);
  console.log('🔍 DEBUG: Sorted data (first 10):', sorted.slice(0, 10));
  
  // Log all dates with activity
  console.log('🔍 DEBUG: All dates with activity:');
  sorted.forEach(record => {
    console.log(`  ${record.date}: ${record.focus_sessions} sessions`);
  });

  const today = getTodayKey(); // "2026-01-02"

  // 2a. Override today's focus_sessions with local count if provided
  if (typeof todayFocusSessionsOverride === 'number') {
    let todayRecord = sorted.find((record: any) => record.date === today);

    if (todayRecord) {
      todayRecord.focus_sessions = todayFocusSessionsOverride;
    } else {
      sorted.push({
        date: today,
        focus_sessions: todayFocusSessionsOverride,
      });
      sorted.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }

  // 3. Calculate CURRENT streak (streak ending today, including today)
  let currentStreak = 0;
  const todayRecord = sorted.find(r => r.date === today);
  
  console.log('🔍 DEBUG: Today record check:', {
    today,
    todayRecord: todayRecord ? {
      date: todayRecord.date,
      focus_sessions: todayRecord.focus_sessions,
      hasActivity: todayRecord.focus_sessions > 0
    } : null,
    totalRecords: sorted.length
  });
  
  if (todayRecord && todayRecord.focus_sessions > 0) {
    // Today has activity, so count backwards from today
    currentStreak = 1; // Include today
    for (let i = sorted.length - 2; i >= 0; i--) {
      const curr = new Date(sorted[i].date);
      const next = new Date(sorted[i+1].date);
      
      const diffDays = Math.floor(
        (next.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000)
      );
      
      if (diffDays === 1 && sorted[i].focus_sessions > 0) {
        currentStreak++;
      } else {
        break; // Gap found
      }
    }
  }
  // If today has no activity, currentStreak remains 0

  // 4. Calculate LONGEST streak (total count of all active days, gaps allowed)
  // NEW LOGIC: Longest streak = total number of days with activity (skipped days don't break streak)
  const longestStreak = sorted.length; // All active days count toward streak
  
  console.log('🔍 DEBUG: Longest streak calculation (gaps allowed):');
  console.log(`  Total active days: ${sorted.length}`);
  console.log(`  Longest streak: ${longestStreak} (includes all days with at least 1 session)`);

  const result = {
    currentStreak,
    longestStreak
  };

  console.log('🔍 DEBUG: Final result:', result);

  return result;
};

export default function ProjectPlayAreaPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const router = useRouter();
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [sessionDuration, setSessionDuration] = useState(MODE_CONFIG.focus);
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
  const [boardTasks, setBoardTasks] = useState<BoardTaskCard[]>([]);
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeWallpaper, setThemeWallpaper] = useState<string | null>(null);
  const [currentBoardTask, setCurrentBoardTask] = useState<BoardTaskCard | null>(null);
  
  // Track last active date for day-end detection
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);

  // Frequency change confirmation dialog state
  const [frequencyConfirmDialogOpen, setFrequencyConfirmDialogOpen] = useState(false);
  const [pendingFrequencyChange, setPendingFrequencyChange] = useState<{
    newValue: number;
    applyImmediately: boolean;
  } | null>(null);

  // Session timing state
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);

  // Create stable task signature for useEffect dependencies
  const taskSignature = useMemo(
    () =>
      boardTasks
        .map(
          (t) =>
            `${t.id}:${t.sortOrder}:${t.completedAt ? 'done' : 'todo'}:${t.status}`
        )
        .join(','),
    [boardTasks]
  );
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCompletedRef = useRef<boolean>(false);
  const prevModeRef = useRef<'focus' | 'short' | 'long'>('focus');
  const sessionRecordsRef = useRef<SessionRecord[]>([]);

  const fetchBoardTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        const allTasks = data.tasks || [];
        setBoardTasks(allTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const debouncedFetchBoardTasks = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchBoardTasks();
    }, 500);
  }, [projectId]);

  // Load tasks on mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchBoardTasks();
    }
  }, [projectId]);

  useEffect(() => {
    async function getProject() {
      if (!projectId || typeof projectId !== 'string') return;

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('projects')
          .select('id, project_name, duration_type, start_date, end_date, weekdays, planned_hours')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setProject(data);
        }
      } catch (err) {
        console.error('Failed to fetch project:', err);
      }
    }

    getProject();
  }, [projectId]);

  // NEW: Load real streak data from DB on mount and projectId change
  useEffect(() => {
    async function loadRealStreaks() {
      if (!projectId) return;

      try {
        console.log('🔥 Loading real streak data from DB...');
        const { currentStreak, longestStreak } = await calculateStreakFromHistory(projectId);
        
        console.log('✅ Real streaks loaded:', { currentStreak, longestStreak });

        setProjectStats(prev => ({
          ...prev,
          currentStreak,
          longestStreak,
          lastActiveDate: getTodayKey()
        }));

        // Also load other stats from localStorage if available
        if (typeof window !== 'undefined') {
          const savedStats = window.localStorage.getItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`);
          if (savedStats) {
            const parsed = JSON.parse(savedStats);
            setProjectStats(prev => ({
              ...prev,
              // Keep DB-loaded streaks but update other stats
              totalTasksCompleted: parsed.totalTasksCompleted || prev.totalTasksCompleted,
              totalSessionsCompleted: parsed.totalSessionsCompleted || prev.totalSessionsCompleted,
              totalHoursWorked: parsed.totalHoursWorked || prev.totalHoursWorked,
              lastActiveDate: parsed.lastActiveDate || prev.lastActiveDate,
            }));
          }
        }
      } catch (error) {
        console.error('❌ Failed to load real streaks:', error);
      }
    }

    loadRealStreaks();
  }, [projectId]);

  // Disable focus alerts on login/mount
  useEffect(() => {
    console.log('🔔 User logged in - disabling focus alerts');
    
    // Check if focus alerts were previously enabled
    if (typeof window !== 'undefined' && projectId) {
      const savedAlertsEnabled = window.localStorage.getItem(`alertsEnabled_${projectId}`);
      const wasEnabled = savedAlertsEnabled === 'true';
      
      // Load last active date from localStorage
      const savedDate = window.localStorage.getItem(`lastActiveDate_${projectId}`);
      setLastActiveDate(savedDate);
      
      // Disable focus alerts
      setAlertsEnabled(false);
      
      // Show toast notification if alerts were previously enabled
      if (wasEnabled) {
        setTimeout(() => {
          setToastMessage('Your Focus Alerts have been unchecked. Please enable and configure them to utilize this feature!');
          setToastVisible(true);
          setTimeout(() => {
            setToastVisible(false);
          }, 5000);
        }, 1000); // Delay to ensure component is fully mounted
      }
    }
  }, [projectId]);

  // Check for day end and disable focus alerts at midnight
  useEffect(() => {
    const checkDayEnd = () => {
      const today = getTodayKey();
      
      if (lastActiveDate && lastActiveDate !== today) {
        console.log('🌙 Day ended - disabling focus alerts');
        setAlertsEnabled(false);
        
        // Show alert notification
        setToastMessage('Focus alerts have been disabled. Please enable and configure them fresh for today!');
        setToastVisible(true);
        setTimeout(() => {
          setToastVisible(false);
        }, 5000);
      }
      
      // Update last active date
      setLastActiveDate(today);
      if (typeof window !== 'undefined' && projectId) {
        window.localStorage.setItem(`lastActiveDate_${projectId}`, today);
      }
    };

    // Check immediately
    checkDayEnd();

    // Check every minute for day change
    const interval = setInterval(checkDayEnd, 60000);

    return () => clearInterval(interval);
  }, [lastActiveDate, projectId]);

  useEffect(() => {
    // Only increment when COMING BACK FROM break, not when entering break
    if (prevModeRef.current === 'short' || prevModeRef.current === 'long') {
      if (mode === 'focus') {
        // Only here: We're transitioning FROM break TO focus
        // This is when break actually COMPLETES
        console.log('✅ Break session completed! Incrementing breakSessions');
        
        setDailyStats(prev => {
          const newStats = {
            ...prev,
            breakSessions: (prev.breakSessions || 0) + 1,
          };
          
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              `${DAILY_STATS_STORAGE_KEY}_${getTodayKey()}`,
              JSON.stringify(newStats)
            );
          }
          
          return newStats;
        });
      }
    }
    
    prevModeRef.current = mode;
  }, [mode]);

  const [timeInput, setTimeInput] = useState(formatSecondsToInput(MODE_CONFIG.focus));
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [activeControl, setActiveControl] = useState<'play' | 'pause' | null>(null);
  const [taskTimeInputs, setTaskTimeInputs] = useState<Record<string, string>>({});
  const [showInterface, setShowInterface] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [projectWidgetOpen, setProjectWidgetOpen] = useState(true);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isNoteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('<p>Write your reflections...</p>');
  const [dailyPomodoro, setDailyPomodoro] = useState<{ date: string; count: number }>(() => ({
    date: getTodayKey(),
    count: 0,
  }));
  const [customThemeColors, setCustomThemeColors] = useState<null | typeof DEFAULT_THEME_COLORS>(null);
  const themeColors = customThemeColors ?? DEFAULT_THEME_COLORS;

  const { theme, setTheme } = useTheme();

  const activeWallpaper = themeWallpaper ?? theme?.wallpaper_url ?? null;
  const hasActiveWallpaper = Boolean(activeWallpaper);

  useEffect(() => {
    if (theme?.wallpaper_url && themeWallpaper !== theme.wallpaper_url) {
      setThemeWallpaper(theme.wallpaper_url);
    }
  }, [theme?.wallpaper_url, themeWallpaper]);

  const layoutStyle = useMemo(() => {
    const style = {
      backgroundColor: hasActiveWallpaper ? 'transparent' : themeColors.surface,
      backgroundImage: hasActiveWallpaper ? `url(${activeWallpaper})` : undefined,
      backgroundSize: hasActiveWallpaper ? 'cover' : undefined,
      backgroundPosition: hasActiveWallpaper ? 'center' : undefined,
    };
    return style;
  }, [hasActiveWallpaper, themeColors.surface, activeWallpaper, themeWallpaper, theme?.wallpaper_url]);

  const panelStyle = useMemo(() => ({
    backgroundColor: hasActiveWallpaper ? 'transparent' : themeColors.panel,
    borderColor: themeColors.border,
  }), [hasActiveWallpaper, themeColors.panel, themeColors.border]);

  const timerStyle = useMemo(() => ({
    backgroundColor: hasActiveWallpaper ? 'rgba(0,0,0,0.3)' : themeColors.panel,
    borderColor: themeColors.border,
  }), [hasActiveWallpaper, themeColors.panel, themeColors.border]);

  const chipStyle = useMemo(() => ({
    backgroundColor: themeColors.chip,
    borderColor: themeColors.border,
  }), [themeColors.chip, themeColors.border]);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialMouse, setInitialMouse] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('🖱️ Mouse Down Event:', {
      clientX: e.clientX,
      clientY: e.clientY,
      targetTagName: (e.target as HTMLElement)?.tagName,
      hasActiveWallpaper,
      themeWallpaper,
      themeWallpaperUrl: theme?.wallpaper_url
    });
    setIsDragging(true);
    setInitialMouse({ x: e.clientX, y: e.clientY });
    setInitialOffset(dragOffset);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - initialMouse.x;
      const deltaY = e.clientY - initialMouse.y;
      console.log('🖱️ Mouse Move (Dragging):', {
        deltaX,
        deltaY,
        newOffset: { x: initialOffset.x + deltaX, y: initialOffset.y + deltaY }
      });
      setDragOffset({ x: initialOffset.x + deltaX, y: initialOffset.y + deltaY });
    }
  };

  const handleMouseUp = () => {
    console.log('🖱️ Mouse Up Event - Drag ended');
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const alertTaskOptions = useMemo(
    () => boardTasks
      .filter((task) => task.status !== 'achieved' && !task.completedAt)
      .map((task) => ({ id: task.id, title: task.title })),
    [boardTasks],
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTimerType, setSettingsTimerType] = useState<TimerMode>('pomodoro');
  const [stayOnTaskInterval, setStayOnTaskInterval] = useState(0);
  const [alertMode, setAlertMode] = useState<'common' | 'selective'>('selective');
  const [selectedAlertTaskIds, setSelectedAlertTaskIds] = useState<string[]>([]);
  
  // Stats overlay state
  const [statsOverlayOpen, setStatsOverlayOpen] = useState(false);
  
  // Wrapper to log Alert Frequency changes
  const handleStayOnTaskIntervalChange = useCallback((value: number) => {
    // Check if timer is active (running or paused)
    const isTimerActive = isRunning || (sessionStartTime && !isRunning);

    if (isTimerActive) {
      // Determine if frequency change affects current task
      let shouldShowDialog = false;
      
      if (alertMode === 'common') {
        // Common mode: frequency change affects all tasks including current one
        shouldShowDialog = true;
      } else if (alertMode === 'selective' && currentBoardTask) {
        // Selective mode: only show dialog if current task is in selected alert tasks
        shouldShowDialog = selectedAlertTaskIds.includes(currentBoardTask.id);
      }

      if (shouldShowDialog) {
        // Show confirmation dialog for active timer when change affects current task
        setPendingFrequencyChange({
          newValue: value,
          applyImmediately: false // Default to apply on next session
        });
        setFrequencyConfirmDialogOpen(true);
        console.log('🔔 Frequency change requested during active timer - showing confirmation');
      } else {
        // Apply change immediately if it doesn't affect current task
        console.log('🔔 Alert Frequency changing (no impact on current task):', stayOnTaskInterval, '→', value);
        setStayOnTaskInterval(value);
      }
    } else {
      // Apply change immediately for inactive timer
      console.log('🔔 Alert Frequency changing:', stayOnTaskInterval, '→', value);
      setStayOnTaskInterval(value);
    }
  }, [isRunning, sessionStartTime, stayOnTaskInterval, alertMode, currentBoardTask, selectedAlertTaskIds]);

  const [stayOnTaskRepeat, setStayOnTaskRepeat] = useState(true);
  const [stayOnTaskModeSelected, setStayOnTaskModeSelected] = useState(false);
  const [stayOnTaskFallback, setStayOnTaskFallback] = useState<StayOnTaskFallback>('focused');
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('timer');
  const [settingsTabFocusSignal, setSettingsTabFocusSignal] = useState(0);
  const [alertSectionFocusSignal, setAlertSectionFocusSignal] = useState(0);
  const [selectedAlertTaskId, setSelectedAlertTaskId] = useState<string | null>(null);
  const [pomodoroDurationMode, setPomodoroDurationMode] = useState<PomodoroDurationMode>('default');
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(true);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoCheckTasks, setAutoCheckTasks] = useState(true);
  const [sendCompletedToBottom, setSendCompletedToBottom] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
  const DEFAULT_FOCUS_MINUTES = 25;
  const DEFAULT_SHORT_BREAK_MINUTES = 5;
  const DEFAULT_LONG_BREAK_MINUTES = 10;

  const [defaultFocusDuration, setDefaultFocusDuration] = useState(DEFAULT_FOCUS_MINUTES);
  const [defaultShortBreak, setDefaultShortBreak] = useState(DEFAULT_SHORT_BREAK_MINUTES);
  const [defaultLongBreak, setDefaultLongBreak] = useState(DEFAULT_LONG_BREAK_MINUTES);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastCompletedTask, setLastCompletedTask] = useState<BoardTaskCard | null>(null);
  
  // Track previous focus duration to detect actual changes
  const previousFocusDurationRef = useRef(defaultFocusDuration);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [currentAlertTask, setCurrentAlertTask] = useState<BoardTaskCard | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    taskId: string;
    taskIds: string[];
    frequency: number;
    repeatMode: 'repeat' | 'once';
    defaultResponse: 'focused' | 'deviated';
    enabled: boolean;
    mode: 'common' | 'selective';
  } | null>(null);
  const [triggeredAlerts, setTriggeredAlerts] = useState<Set<number>>(new Set());

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Save alertsEnabled state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && projectId) {
      window.localStorage.setItem(`alertsEnabled_${projectId}`, String(alertsEnabled));
    }
  }, [alertsEnabled, projectId]);

  // Alert user when closing the app about focus alerts being disabled
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (alertsEnabled) {
        const message = 'Your focus alert settings will be disabled. Please remember to enable them on your next login for a fresh start!';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [alertsEnabled]);

  // Handle frequency change confirmation dialog responses
  const handleFrequencyConfirm = useCallback((applyImmediately: boolean) => {
    if (!pendingFrequencyChange) return;

    const { newValue } = pendingFrequencyChange;

    if (applyImmediately) {
      // Apply change immediately and restart current session
      console.log('🔔 Applying frequency change immediately:', stayOnTaskInterval, '→', newValue);
      setStayOnTaskInterval(newValue);
      setTriggeredAlerts(new Set()); // Reset triggered alerts for current session

      // Calculate session duration inline
      let newSessionDuration: number;
      if (!currentBoardTask || pomodoroDurationMode === 'default') {
        newSessionDuration = defaultFocusDuration * 60;
      } else if (pomodoroDurationMode === 'customised') {
        const minutes = currentBoardTask.customFocusTime ?? currentBoardTask.duration ?? defaultFocusDuration;
        newSessionDuration = minutes * 60;
      } else {
        newSessionDuration = defaultFocusDuration * 60;
      }

      // Restart the current timer session from the beginning
      setSessionStartTime(new Date());
      setAccumulatedSeconds(0);
      setTimeLeft(newSessionDuration);
      setTimeInput(formatSecondsToInput(newSessionDuration));

      setToastMessage('Alert frequency updated - current session restarted');
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
      }, 3000);
    } else {
      // Queue change for next session
      console.log('🔔 Queuing frequency change for next session:', stayOnTaskInterval, '→', newValue);
      setStayOnTaskInterval(newValue);

      setToastMessage('Alert frequency will apply to next session');
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
      }, 3000);
    }

    // Close dialog and reset pending change
    setFrequencyConfirmDialogOpen(false);
    setPendingFrequencyChange(null);
  }, [pendingFrequencyChange, stayOnTaskInterval, currentBoardTask, pomodoroDurationMode, defaultFocusDuration]);

  const handleFrequencyCancel = useCallback(() => {
    setFrequencyConfirmDialogOpen(false);
    setPendingFrequencyChange(null);
  }, []);

  // Wrapper to log Focus Duration changes
  const handleDefaultFocusDurationChange = useCallback((value: number) => {
    console.log('⏱️ Focus Duration changing:', defaultFocusDuration, '→', value);
    setDefaultFocusDuration(value);
  }, [defaultFocusDuration]);

  // Calculate current task duration reactively for alert validation
  const currentTaskDuration = useMemo(() => {
    if (!selectedAlertTaskId) {
      console.log('🔔 Alert Validation: No task selected');
      return undefined;
    }
    
    const selectedTask = boardTasks.find(t => t.id === selectedAlertTaskId);
    if (!selectedTask) {
      console.log('🔔 Alert Validation: Task not found, using default:', defaultFocusDuration);
      return defaultFocusDuration;
    }
    
    // Get the actual task duration - check both fields and use whichever is set
    // Priority: customFocusTime (if task is customised) > duration > defaultFocusDuration
    let taskDuration: number;
    
    if (selectedTask.timerMode === 'customised' && selectedTask.customFocusTime) {
      taskDuration = selectedTask.customFocusTime;
    } else if (selectedTask.duration) {
      taskDuration = selectedTask.duration;
    } else {
      taskDuration = defaultFocusDuration;
    }
    
    console.log('🔔 Alert Validation:', {
      taskId: selectedTask.id,
      taskTitle: selectedTask.title,
      timerMode: selectedTask.timerMode,
      customFocusTime: selectedTask.customFocusTime,
      duration: selectedTask.duration,
      defaultFocusDuration,
      calculatedDuration: taskDuration
    });
    
    return taskDuration;
  }, [selectedAlertTaskId, boardTasks, pomodoroDurationMode, defaultFocusDuration]);

// Calculate realistic daily goals based on historical performance
const calculateDailyGoals = async (projectId: string) => {
  try {
    console.log('🎯 Calculating daily goals based on historical data...');
    
    // Fetch last 30 days of daily achievements
    const response = await fetch(`/api/daily-achievements?projectId=${projectId}&days=30`);
    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      console.log('📊 No historical data found, using default goals');
      return {
        tasksPerDay: 3,
        sessionsPerDay: 8,
        hoursPerDay: 4,
      };
    }
    
    const records = data.data;
    
    // Calculate averages from historical data
    const totalTasks = records.reduce((sum: number, record: any) => sum + (record.tasks_completed || 0), 0);
    const totalSessions = records.reduce((sum: number, record: any) => sum + (record.focus_sessions || 0), 0);
    const totalHours = records.reduce((sum: number, record: any) => sum + (record.completed_hours || 0), 0);
    const activeDays = records.filter((record: any) => record.focus_sessions > 0).length;
    
    // Use active days for averaging (days with actual work)
    const avgTasksPerDay = activeDays > 0 ? Math.round(totalTasks / activeDays) : 3;
    const avgSessionsPerDay = activeDays > 0 ? Math.round(totalSessions / activeDays) : 8;
    const avgHoursPerDay = activeDays > 0 ? Math.round((totalHours / activeDays) * 10) / 10 : 4;
    
    // Set minimum realistic goals
    const calculatedGoals = {
      tasksPerDay: Math.max(1, avgTasksPerDay),
      sessionsPerDay: Math.max(4, avgSessionsPerDay),
      hoursPerDay: Math.max(2, avgHoursPerDay),
    };
    
    console.log('🎯 Calculated daily goals:', {
      historicalData: { totalTasks, totalSessions, totalHours, activeDays },
      calculatedGoals
    });
    
    return calculatedGoals;
  } catch (error) {
    console.error('❌ Failed to calculate daily goals:', error);
    return {
      tasksPerDay: 3,
      sessionsPerDay: 8,
      hoursPerDay: 4,
    };
  }
};

// Stats tracking state - LOAD FROM DB ON INIT with calculated goals
const [projectStats, setProjectStats] = useState<ProjectStats>(() => {
  // Start with defaults, will be updated with calculated goals
  return {
    projectId: projectId || '',
    dailyGoals: {
      tasksPerDay: 3,  // Default, will be updated
      sessionsPerDay: 8,  // Default, will be updated
      hoursPerDay: 4,  // Default, will be updated
    },
    weeklyGoals: {
      tasksPerWeek: 15,  // Will be recalculated based on daily goals
      sessionsPerWeek: 40,
      hoursPerWeek: 20,
    },
    currentStreak: 0, // Will be loaded from DB
    longestStreak: 0, // Will be loaded from DB
    totalTasksCompleted: 0,
    totalSessionsCompleted: 0,
    totalHoursWorked: 0,
    lastActiveDate: null,
  };
});

  const [dailyStats, setDailyStats] = useState<DailyStats>(() => ({
    date: getTodayKey(),
    tasksCompleted: 0,
    sessionsCompleted: 0,
    breakSessions: 0,
    hoursWorked: 0,
    targetTasks: 3,
    targetSessions: 8,
    targetHours: 4,
    achieved: false,
    breakTime: 0,
    deviationTime: 0,
    focusTime: 0,
  }));

  const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>([]);
  const [sessionPhase, setSessionPhase] = useState<'focus' | 'break' | 'ready'>('focus');

  // Sync status tracking
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [statsData, setStatsData] = useState<{ daily: any; weekly: any; monthly: any; yearly: any } | undefined>(undefined);
  const { mergeWithSupabase, syncToSupabase, isLoaded } = useLocalStats(projectId);

  const plannedTaskOptions = boardTasks.filter((task) => task.status !== 'achieved' && !task.completedAt);
  const totalPlannedMinutes = plannedTaskOptions.reduce((sum, task) => {
    // If in default mode, use default focus duration for all tasks
    if (pomodoroDurationMode === 'default') {
      return sum + defaultFocusDuration;
    }
    // If in customised mode, use task's custom time or duration
    const taskMinutes = task.customFocusTime ?? task.duration ?? defaultFocusDuration;
    return sum + taskMinutes;
  }, 0);

  const calculatePlannedHours = useCallback((dateKey: string) => {
    const tasksForDate = boardTasks.filter(task => {
      return task.status !== 'achieved' && !task.completedAt;
    });
    
    let totalMinutes = 0;
    tasksForDate.forEach(task => {
      if (pomodoroDurationMode === 'default') {
        totalMinutes += defaultFocusDuration;
      } else {
        const taskMinutes = task.customFocusTime ?? task.duration ?? defaultFocusDuration;
        totalMinutes += taskMinutes;
      }
    });
    
    return totalMinutes / 60;
  }, [boardTasks, pomodoroDurationMode, defaultFocusDuration]);

  type HoursSyncOptions = {
    dateKey?: string;
    plannedHoursOverride?: number;
    completedHoursOverride?: number;
  };

  const syncDailyHoursToDB = useCallback(async (options?: HoursSyncOptions) => {
    const targetDate = options?.dateKey || getTodayKey();
    const plannedHours = options?.plannedHoursOverride ?? calculatePlannedHours(targetDate);
    const completedHours = options?.completedHoursOverride ?? (dailyStats.hoursWorked || 0);
    
    console.log(`Syncing hours for ${targetDate}:`, {
      plannedHours,
      completedHours,
      mode: pomodoroDurationMode
    });
    
    try {
      console.log('🚀 Making sync request to:', '/api/dashboard/achievements/sync-hours', {
        projectId,
        dateKey: targetDate,
        plannedHours,
        completedHours,
        pomodoroDurationMode
      });

      const response = await fetch(
        '/api/dashboard/achievements/sync-hours',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            projectId,
            dateKey: targetDate,
            plannedHours,
            completedHours,
            pomodoroDurationMode,
          }),
        }
      );

      console.log('📡 Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        type: response.type
      });

      if (!response.ok) {
        let errorText = '';
        let errorJson = null;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorJson = await response.json();
            errorText = JSON.stringify(errorJson);
          } else {
            errorText = await response.text();
          }
        } catch (textError) {
          errorText = 'Could not read response text';
          console.error('Error reading response:', textError);
        }

        console.error('❌ Sync failed - Response details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
          errorJson
        });
        
        if (response.status === 401) {
          console.error('Authentication failed. User may need to re-login.');
        }
        
        throw new Error(`Sync failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`✅ Hours synced for ${targetDate}:`, responseData);
    } catch (error) {
      console.error('Error syncing hours:', error);
      // Don't rethrow - we don't want to break the UI flow
    }
  }, [projectId, calculatePlannedHours, dailyStats.hoursWorked, pomodoroDurationMode]);

  useEffect(() => {
    console.log('Pomodoro mode changed to:', pomodoroDurationMode);
    syncDailyHoursToDB();
  }, [pomodoroDurationMode, syncDailyHoursToDB]);

  // Update tasksCompleted when tasks are completed
  const completedTasksCount = boardTasks.filter(task => task.status === 'achieved' || task.completedAt).length;
  useEffect(() => {
    console.log('Tasks completed count changed to:', completedTasksCount);
    syncDailyHoursToDB();
  }, [completedTasksCount, syncDailyHoursToDB]);

  // Sync planned hours when tasks are created or deleted
  const tasksCount = boardTasks.length;
  useEffect(() => {
    console.log('Tasks count changed to:', tasksCount);
    syncDailyHoursToDB();
  }, [tasksCount, syncDailyHoursToDB]);

  const fetchStats = useCallback(async (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    try {
      const response = await fetch(`/api/stats/${projectId}?type=${type}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`Stats API error (${type}):`, response.status, errorData);
        return null;
      }
      const data = await response.json();
      console.log(`Fetched ${type} stats:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${type} stats:`, error);
      return null;
    }
  }, [projectId]);

  const loadStats = useCallback(async () => {
    console.log('Loading stats for project:', projectId, 'isLoaded:', isLoaded);
    
    // Sync local data to DB first
    const syncResult = await syncToSupabase();
    console.log('Sync result:', syncResult);
    
    // Then fetch updated data from DB
    const [daily, weekly, monthly, yearly] = await Promise.all([
      fetchStats('daily'),
      fetchStats('weekly'),
      fetchStats('monthly'),
      fetchStats('yearly'),
    ]);
    
    console.log('Raw stats from API:', { daily, weekly, monthly, yearly });
    
    // Handle daily as array
    let mergedDaily: any;
    if (Array.isArray(daily)) {
      const today = getTodayKey();
      const todayEntry = daily.find(d => d.date === today) || {};
      mergedDaily = {
        ...todayEntry,
        tasksCompleted: dailyStats.tasksCompleted === 0 ? (todayEntry.tasks_completed || 0) : dailyStats.tasksCompleted,
        focusSessions: dailyPomodoro.count,
        completedHours: dailyStats.hoursWorked === 0 ? (todayEntry.completed_hours || 0) : dailyStats.hoursWorked,
        breakSessions: dailyStats.breakSessions === 0 ? (todayEntry.break_sessions || 0) : dailyStats.breakSessions,
        currentStreak: projectStats.currentStreak,
        longestStreak: projectStats.longestStreak,
        plannedHours: calculatePlannedHours(getTodayKey()),
      };
      // Update today's entry in the array with merged data while preserving DB alerts
      const updatedDaily = daily.map(d => {
        if (d.date === today) {
          return {
            ...d,
            // Preserve DB values for focused_alerts and deviated_alerts
            focused_alerts: d.focused_alerts || 0,
            deviated_alerts: d.deviated_alerts || 0,
            // Update other fields with merged values
            tasks_completed: mergedDaily.tasksCompleted,
            focus_sessions: mergedDaily.focusSessions,
            completed_hours: mergedDaily.completedHours,
            break_sessions: mergedDaily.breakSessions,
            current_streak: mergedDaily.currentStreak,
            longest_streak: mergedDaily.longestStreak,
            planned_hours: mergedDaily.plannedHours,
          };
        }
        return d;
      });
      // Keep the full array for timeline
      mergedDaily = { ...mergedDaily, dailyArray: updatedDaily };
    } else {
      mergedDaily = mergeWithSupabase(daily || {});
    }
    
    console.log('Merged daily stats:', mergedDaily);
    
    setStatsData({ daily: mergedDaily, weekly, monthly, yearly });
  }, [projectId, mergeWithSupabase, syncToSupabase, dailyStats, projectStats, dailyPomodoro, calculatePlannedHours, fetchStats]);

  useEffect(() => {
    if (projectId && isLoaded) {
      loadStats().catch(err => console.error('Load stats error:', err));
    }
  }, [projectId, isLoaded, loadStats]);

  // Load calculated daily goals based on historical performance
  useEffect(() => {
    async function loadCalculatedGoals() {
      if (!projectId) return;

      try {
        const calculatedGoals = await calculateDailyGoals(projectId);

        setProjectStats(prev => ({
          ...prev,
          dailyGoals: calculatedGoals,
          weeklyGoals: {
            tasksPerWeek: calculatedGoals.tasksPerDay * 5,  // 5 working days
            sessionsPerWeek: calculatedGoals.sessionsPerDay * 5,
            hoursPerWeek: calculatedGoals.hoursPerDay * 5,
          },
        }));

        console.log('✅ Updated project stats with calculated goals:', calculatedGoals);
      } catch (error) {
        console.error('❌ Failed to load calculated goals:', error);
      }
    }

    loadCalculatedGoals();
  }, [projectId]);

  // Move recordSessionCompletion here, before it's used
  const playNotificationSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.25, context.currentTime);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
      oscillator.stop(context.currentTime + 1);
      oscillator.onended = () => context.close();
    } catch (error) {
      console.warn('Notification sound failed', error);
    }
  }, []);


  // Move handleSessionComplete here, after all state is defined
  const handleSessionComplete = useCallback(async () => {
    // Prevent multiple calls for the same session completion
    if (sessionCompletedRef.current) {
      console.log('🔄 Session completion already processed, skipping duplicate call');
      return;
    }
    sessionCompletedRef.current = true;
    console.log('🔒 Locked: sessionCompletedRef set to TRUE');
    
    setIsRunning(false);
    setActiveControl(null);
    playNotificationSound();

    // Only record daily pomodoro completion for focus sessions
    const todayKey = getTodayKey();
    const plannedHoursSnapshot = calculatePlannedHours(todayKey);
    const previousCountToday = dailyPomodoro.date === todayKey ? dailyPomodoro.count : 0;
    let nextFocusSessionCount = previousCountToday;
    if (mode === 'focus') {
      console.log('✅ Recording FOCUS session completion');
      // Increment pomodoro count
      nextFocusSessionCount = previousCountToday + 1;
      const next = {
        date: todayKey,
        count: nextFocusSessionCount,
      };
      setDailyPomodoro(next);
      console.log('📈 Daily Pomodoro count:', previousCountToday, '→', next.count);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DAILY_POMODORO_STORAGE_KEY, JSON.stringify(next));
      }
    } else {
      console.log('⏭️ Skipping pomodoro count for', mode, 'session');
    }

    // Calculate streak from complete historical record
    try {
      const streaks = await calculateStreakFromHistory(
        projectId,
        mode === 'focus' ? nextFocusSessionCount : undefined
      );
      
      setProjectStats(prev => {
        const newStats = {
          ...prev,
          currentStreak: streaks.currentStreak,
          longestStreak: streaks.longestStreak,
          lastActiveDate: getTodayKey(),
        };

        // Save to localStorage
        if (typeof window !== 'undefined' && projectId) {
          window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(newStats));
        }

        return newStats;
      });

      console.log('🔥 Updated streaks from full history:', streaks);
    } catch (error) {
      console.error('❌ Failed to recalculate streaks:', error);
      // Fallback: don't update streaks if calculation fails
    }

    // Sync to database immediately after focus session
    if (mode === 'focus' && projectId) {
      try {
        const streaks = await calculateStreakFromHistory(projectId, nextFocusSessionCount);
        
        // Immediate PATCH for streak only (fast response)
        fetch('/api/daily-achievements', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            date: getTodayKey(),
            currentStreak: streaks.currentStreak,
            longestStreak: streaks.longestStreak,
          }),
        }).catch(error => console.error('❌ Failed to sync streak:', error));
      } catch (error) {
        console.error('❌ Failed to get streaks for DB sync:', error);
      }

      // Note: Full sync will be triggered by useEffect watching dailyPomodoro changes
    }

    // Record session details (with idempotency check)
    // Calculate actual time spent in this session
    const sessionEnd = new Date();
    
    // For focus sessions: use accumulated time + current segment time
    // For breaks: use planned duration for session record, but track actual time for break_time
    let actualDurationSeconds: number;
    if (mode === 'focus') {
      const currentSegmentSeconds = sessionStartTime 
        ? (sessionEnd.getTime() - sessionStartTime.getTime()) / 1000 
        : 0;
      actualDurationSeconds = accumulatedSeconds + currentSegmentSeconds;
      console.log(`✅ Session complete: accumulated=${accumulatedSeconds.toFixed(1)}s + current=${currentSegmentSeconds.toFixed(1)}s = total=${actualDurationSeconds.toFixed(1)}s`);
    } else {
      // For breaks: use planned duration for session record
      actualDurationSeconds = sessionDuration;
      console.log(`✅ Break session complete: planned duration=${sessionDuration}s`);
    }
    
    const actualDurationMinutes = actualDurationSeconds / 60;
    
    // Track break_time for successful break completions (only when timer completes, not on reset)
    if (mode === 'short' || mode === 'long') {
      setDailyStats(prev => {
        const newBreakTime = (prev.breakTime || 0) + actualDurationMinutes;
        const newStats = {
          ...prev,
          breakTime: newBreakTime,
        };
        
        console.log(`📊 Break time updated: ${prev.breakTime || 0} → ${newBreakTime} minutes (+${actualDurationMinutes.toFixed(2)}m)`);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`${DAILY_STATS_STORAGE_KEY}_${getTodayKey()}`, JSON.stringify(newStats));
        }
        
        return newStats;
      });
    }

    console.log(`⏱️ Session duration: planned=${sessionDuration}s, actual=${actualDurationSeconds.toFixed(1)}s`);

    const sessionRecord: SessionRecord = {
      id: crypto.randomUUID(),
      taskId: currentBoardTask?.id || '',
      taskTitle: currentBoardTask?.title || 'No task',
      startTime: sessionStartTime?.toISOString() || '',
      endTime: sessionEnd.toISOString(),
      duration: actualDurationMinutes,
      type: mode,
      completed: true,
    };

    console.log(`📝 Recording ${mode} session:`, {
      duration: actualDurationMinutes,
      type: mode,
      taskTitle: sessionRecord.taskTitle
    });

    setSessionRecords(prev => {
      const updated = [...prev, sessionRecord];
      const todayRecords = updated.filter(r => r.startTime.startsWith(getTodayKey()));
      const todayFocusRecords = todayRecords.filter(r => r.type === 'focus');
      const totalFocusTime = todayFocusRecords.reduce((sum, r) => sum + r.duration, 0);
      
      console.log(`📊 Session records updated:`, {
        totalRecordsToday: todayRecords.length,
        focusRecordsToday: todayFocusRecords.length,
        totalFocusMinutes: totalFocusTime
      });
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SESSION_RECORDS_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    if (currentBoardTask) {
      // Update task session count and actual duration
      const currentSessions = currentBoardTask.sessionsCompleted || 0;
      const currentActualDuration = currentBoardTask.actualDuration || 0;
      const newSessions = currentSessions + (mode === 'focus' ? 1 : 0);
      const newActualDuration = currentActualDuration + (mode === 'focus' ? actualDurationMinutes : 0);

      setBoardTasks((prev) =>
        prev.map((task) =>
          task.id === currentBoardTask.id
            ? {
                ...task,
                sessionsCompleted: newSessions,
                actualDuration: newActualDuration,
              }
            : task
        )
      );

      // Update daily stats (only for focus sessions)
      setDailyStats(prev => {
        const newStats = {
          ...prev,
          hoursWorked: mode === 'focus' && actualDurationSeconds > 0
            ? prev.hoursWorked + (actualDurationMinutes / 60)
            : prev.hoursWorked,
          // Removed automatic tasksCompleted increment - only count on Done/Undo button clicks
          achieved: false, // Recalculate below
        };

        console.log(`📈 hoursWorked update: ${prev.hoursWorked} → ${newStats.hoursWorked} (${(actualDurationMinutes / 60).toFixed(3)} hours added)`);

        // Check if goals are achieved
        newStats.achieved = newStats.tasksCompleted >= newStats.targetTasks &&
                          newStats.sessionsCompleted >= newStats.targetSessions &&
                          newStats.hoursWorked >= newStats.targetHours;

        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`${DAILY_STATS_STORAGE_KEY}_${getTodayKey()}`, JSON.stringify(newStats));
        }

        return newStats;
      });

      const completedHoursAfterSession = mode === 'focus' && actualDurationSeconds > 0
        ? (dailyStats.hoursWorked || 0) + (actualDurationMinutes / 60)
        : (dailyStats.hoursWorked || 0);

      // Sync hours to database after focus session completion
      await syncDailyHoursToDB({
        dateKey: todayKey,
        plannedHoursOverride: plannedHoursSnapshot,
        completedHoursOverride: completedHoursAfterSession,
      });

      // Update project stats (only for focus sessions)
      setProjectStats(prev => {
        const newProjectStats = {
          ...prev,
          // Only increment for focus sessions
          totalSessionsCompleted: mode === 'focus' ? prev.totalSessionsCompleted + 1 : prev.totalSessionsCompleted,
          totalHoursWorked: mode === 'focus' ? prev.totalHoursWorked + (actualDurationMinutes / 60) : prev.totalHoursWorked,
          // Removed automatic totalTasksCompleted increment - only count on Done/Undo button clicks
          lastActiveDate: getTodayKey(),
        };

        // Save to localStorage
        if (typeof window !== 'undefined' && projectId) {
          window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(newProjectStats));
        }

        return newProjectStats;
      });

      // Store the completed task for auto-progression
      setLastCompletedTask(currentBoardTask);
    }

    // Clear accumulated time after session completes
    setAccumulatedSeconds(0);
    
    // Transition to next phase
    if (mode === 'focus') {
      // After focus session, go to short break but keep the task for reference
      console.log('🔄 Transitioning from FOCUS to SHORT BREAK');
      setSessionPhase('break');
      setMode('short');
      const newDuration = getShortBreakDuration();
      setSessionDuration(newDuration);
      setTimeLeft(newDuration);
      setTimeInput(formatSecondsToInput(newDuration));
      console.log('⏰ Starting short break with duration:', newDuration, 'seconds');
      setSessionStartTime(null); // Reset to prevent break time from being tracked
      setIsRunning(true);
      setActiveControl('play');
    } else if (mode === 'short') {
      // After short break, auto-start next focus session with the same task
      console.log('🔄 Transitioning from SHORT BREAK to FOCUS');
      setSessionPhase('focus');
      setMode('focus');
      const upcomingFocusDuration = getFocusDuration();
      setSessionDuration(upcomingFocusDuration);
      setTimeLeft(upcomingFocusDuration);
      setTimeInput(formatSecondsToInput(upcomingFocusDuration));
      setSessionStartTime(new Date()); // Set fresh start time for new focus session
      setAccumulatedSeconds(0); // Reset for new session
      setIsRunning(true);
      setActiveControl('play');
    }
  }, [currentBoardTask, mode, sessionDuration, projectId, playNotificationSound, sessionStartTime, accumulatedSeconds, dailyPomodoro.count, syncDailyHoursToDB, dailyPomodoro.date]);
  // Reset the session completed ref when a new session starts
  useEffect(() => {
    if (isRunning) {
      console.log('🔓 Timer started - Resetting sessionCompletedRef to FALSE');
      sessionCompletedRef.current = false;
    }
  }, [isRunning, mode]); // Reset when timer starts or mode changes

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, handleSessionComplete]);

  useEffect(() => {
    if (isRunning && timeLeft <= 0) {
      console.log('✅ Timer reached zero! Stopping timer...');
      setIsRunning(false);
      setTimeLeft(0);
    }
  }, [timeLeft, isRunning]);

  // Load alert configuration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('focusAlertConfig');
      if (stored) {
        const config = JSON.parse(stored);
        setAlertConfig(config);
        console.log('🔔 Loaded alert configuration:', config);
      }
    } catch (error) {
      console.warn('Failed to load alert configuration:', error);
    }
  }, []);

  // Alert trigger logic
  useEffect(() => {
    if (!isRunning || !alertConfig || !alertConfig.enabled || mode !== 'focus') return;

    // For selective mode, only trigger alerts if the current task is in the selected task IDs list
    // For common mode, trigger alerts for any task
    if (alertConfig.mode === 'selective' && currentBoardTask) {
      const isTaskSelected = alertConfig.taskIds.includes(currentBoardTask.id);
      if (!isTaskSelected) {
        // Only log once per task to prevent console spam
        if (lastSkippedTaskRef.current !== currentBoardTask.id) {
          console.log('🔔 Alert skipped (selective mode): current task', currentBoardTask.id, 'not in selected tasks', alertConfig.taskIds);
          lastSkippedTaskRef.current = currentBoardTask.id;
        }
        return;
      }
      // Reset skip tracking when task is selected
      if (lastSkippedTaskRef.current === currentBoardTask.id) {
        console.log('🔔 Alert active (selective mode): current task', currentBoardTask.id, 'is in selected tasks');
        lastSkippedTaskRef.current = null;
      }
    }
    
    if (alertConfig.mode === 'common') {
      // Only log once when switching to common mode
      if (lastSkippedTaskRef.current !== 'common-logged') {
        console.log('🔔 Alert active (common mode): will trigger for any task');
        lastSkippedTaskRef.current = 'common-logged';
      }
    }

    const sessionDuration = getFocusDuration();
    const alertFrequency = alertConfig.frequency * 60; // Convert minutes to seconds
    const isRepeatMode = alertConfig.repeatMode === 'repeat';

    // Calculate elapsed time (how much time has passed since session started)
    const elapsedTime = sessionDuration - timeLeft;

    // Calculate alert trigger times based on elapsed time
    const alertTimes = [];
    
    // First alert triggers after alertFrequency seconds have elapsed
    if (isRepeatMode) {
      // For repeat mode, trigger every alertFrequency seconds
      let nextAlertTime = alertFrequency;
      while (nextAlertTime <= sessionDuration) {
        alertTimes.push(nextAlertTime);
        nextAlertTime += alertFrequency;
      }
    } else {
      // For once mode, trigger only once after alertFrequency seconds
      if (alertFrequency <= sessionDuration) {
        alertTimes.push(alertFrequency);
      }
    }

    // Check if current elapsed time matches any alert trigger time
    const shouldTriggerAlert = alertTimes.includes(elapsedTime) && !Array.from(triggeredAlerts).includes(elapsedTime);

    if (shouldTriggerAlert) {
      console.log('🔔 ALERT TRIGGER: elapsedTime =', elapsedTime, 'alertFrequency =', alertFrequency, 'sessionDuration =', sessionDuration);
      setTriggeredAlerts(prev => {
        const newSet = new Set(prev);
        newSet.add(elapsedTime);
        return newSet;
      });

      // Get the current task for the alert - always use the currently running task
      setCurrentAlertTask(currentBoardTask);

      // Play sound and show modal
      alertSound.playAlertSound();
      setAlertModalOpen(true);
    }
  }, [isRunning, alertConfig, mode, timeLeft, boardTasks, currentBoardTask, triggeredAlerts]);

  // Reset triggered alerts when timer starts from stopped state
  const prevIsRunningRef = useRef(isRunning);
  const lastSkippedTaskRef = useRef<string | null>(null);
  
  useEffect(() => {
    const wasNotRunning = !prevIsRunningRef.current;
    const isNowRunning = isRunning;
    
    if (wasNotRunning && isNowRunning && mode === 'focus') {
      setTriggeredAlerts(new Set());
      lastSkippedTaskRef.current = null; // Reset skip tracking
      console.log('🔔 Reset triggered alerts for new focus session');
    }
    
    prevIsRunningRef.current = isRunning;
  }, [isRunning, mode]);

  useEffect(() => {
    if (!isEditingTime) {
      setTimeInput(formatSecondsToInput(timeLeft));
    }
  }, [timeLeft, isEditingTime]);

  useEffect(() => {
    setTaskTimeInputs((prev) => {
      const next: Record<string, string> = {};
      boardTasks.forEach((task) => {
        // Always use the current task duration, don't preserve old input values
        next[task.id] = formatMinutesToClock(task.duration);
      });
      return next;
    });
  }, [boardTasks]);

  // Dynamic update of focus timer when task duration changes
  useEffect(() => {
    if (!currentBoardTask || isRunning) return;

    // Only update if this task uses customized settings
    if (currentBoardTask.timerMode !== 'customised') return;

    const newDuration = getFocusDuration();
    if (newDuration !== sessionDuration) {
      console.log(`🔄 Task duration updated: ${sessionDuration}s → ${newDuration}s`);
      setSessionDuration(newDuration);
      setTimeLeft(newDuration);
      setTimeInput(formatSecondsToInput(newDuration));
    }
  }, [
    currentBoardTask?.duration ?? 0,
    currentBoardTask?.customFocusTime ?? 0,
    currentBoardTask?.timerMode ?? 'default',
    isRunning,
    sessionDuration
  ]);

  useEffect(() => {
    if (boardTasks.length === 0) {
      setSelectedAlertTaskId(null);
      return;
    }
    setSelectedAlertTaskId((prev) => {
      if (prev && boardTasks.some((task) => task.id === prev)) {
        return prev;
      }
      return currentBoardTask?.id ?? boardTasks[0].id;
    });
  }, [boardTasks, currentBoardTask]);

  // Keep currentBoardTask synced when task changes externally (title, priority, duration, etc.)
  useEffect(() => {
    if (!currentBoardTask) return;
    const latestTask = boardTasks.find(task => task.id === currentBoardTask.id);
    if (!latestTask) return;

    // Check if any task property changed
    const taskChanged =
      latestTask.title !== currentBoardTask.title ||
      latestTask.priority !== currentBoardTask.priority ||
      latestTask.duration !== currentBoardTask.duration ||
      latestTask.customFocusTime !== currentBoardTask.customFocusTime ||
      latestTask.timerMode !== currentBoardTask.timerMode ||
      latestTask.completedAt !== currentBoardTask.completedAt ||
      latestTask.status !== currentBoardTask.status;

    if (!taskChanged) return;

    setCurrentBoardTask(latestTask);

    // Only update timer if duration-related fields changed and timer is not running
    const durationChanged =
      latestTask.duration !== currentBoardTask.duration ||
      latestTask.customFocusTime !== currentBoardTask.customFocusTime ||
      latestTask.timerMode !== currentBoardTask.timerMode;

    if (durationChanged && !isRunning) {
      const updatedDuration = getFocusDurationForTask(latestTask);
      if (updatedDuration !== sessionDuration) {
        setSessionDuration(updatedDuration);
        setTimeLeft(updatedDuration);
        setTimeInput(formatSecondsToInput(updatedDuration));
      }
    }
  }, [
    boardTasks,
    currentBoardTask,
    isRunning,
    sessionDuration,
  ]);

  // Auto-refresh timer when switching between Default and Customised modes
  useEffect(() => {
    if (isRunning) return; // Don't interrupt running timer

    let newDuration: number;
    
    if (mode === 'focus') {
      // For focus mode, use task duration or default based on mode
      if (currentBoardTask) {
        newDuration = getFocusDurationForTask(currentBoardTask);
      } else {
        // No task selected - use appropriate default
        const effectiveDefaultMinutes = pomodoroDurationMode === 'customised' 
          ? DEFAULT_FOCUS_MINUTES 
          : defaultFocusDuration;
        newDuration = effectiveDefaultMinutes * 60;
      }
    } else if (mode === 'short') {
      newDuration = getShortBreakDuration();
    } else {
      newDuration = getLongBreakDuration();
    }

    console.log('🔄 Mode switch detected - updating timer:', {
      mode,
      pomodoroDurationMode,
      currentTask: currentBoardTask?.title || 'none',
      newDuration: newDuration / 60,
      oldDuration: sessionDuration / 60
    });

    if (sessionDuration !== newDuration) {
      setSessionDuration(newDuration);
      setTimeLeft(newDuration);
      setTimeInput(formatSecondsToInput(newDuration));
    }
  }, [pomodoroDurationMode, mode, currentBoardTask, isRunning, defaultFocusDuration, defaultShortBreak, defaultLongBreak]);

  // Clear selected tasks when switching to customised mode if task durations don't match alert frequency
  const prevPomodoroDurationModeRef = useRef(pomodoroDurationMode);
  useEffect(() => {
    const modeChanged = prevPomodoroDurationModeRef.current !== pomodoroDurationMode;
    
    if (modeChanged && alertsEnabled) {
      // When switching to customised mode, validate selected tasks
      if (pomodoroDurationMode === 'customised' && selectedAlertTaskIds.length > 0) {
        const alertFrequency = stayOnTaskInterval; // in minutes
        
        // Check if any selected task has a custom duration that doesn't work with alert frequency
        const invalidTasks = selectedAlertTaskIds.filter(taskId => {
          const task = boardTasks.find(t => t.id === taskId);
          if (!task) return true;
          
          const taskDuration = task.customFocusTime || task.duration || defaultFocusDuration;
          
          // Task duration must be greater than alert frequency
          return alertFrequency > 0 && taskDuration <= alertFrequency;
        });
        
        if (invalidTasks.length > 0) {
          console.log('🔔 Clearing selected tasks - custom durations incompatible with alert frequency:', {
            invalidTasks,
            alertFrequency,
            selectedTasks: selectedAlertTaskIds
          });
          
          // Clear selected tasks
          setSelectedAlertTaskIds([]);
          setSelectedAlertTaskId(null);
          
          // Disable alerts
          setAlertsEnabled(false);
          
          // Clear alert config
          setAlertConfig(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('focusAlertConfig');
          }
          
          // Show toast notification
          setToastMessage('Focus alerts cleared - task durations incompatible with alert frequency');
          setToastVisible(true);
          setTimeout(() => {
            setToastVisible(false);
          }, 3000);
        }
      } else {
        // For default mode switch, just disable alerts as before
        console.log('🔔 Timer mode changed - disabling alerts:', prevPomodoroDurationModeRef.current, '→', pomodoroDurationMode);
        setAlertsEnabled(false);
        
        // Clear alert config
        setAlertConfig(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('focusAlertConfig');
        }
        
        // Show toast notification
        setToastMessage('Focus alerts disabled due to timer mode change');
        setToastVisible(true);
        setTimeout(() => {
          setToastVisible(false);
        }, 3000);
      }
    }
    
    prevPomodoroDurationModeRef.current = pomodoroDurationMode;
  }, [pomodoroDurationMode, alertsEnabled]);

  // Reset alert settings when user toggles alertsEnabled
  const prevAlertsEnabledRef = useRef(alertsEnabled);
  useEffect(() => {
    const wasEnabled = prevAlertsEnabledRef.current;
    const isNowEnabled = alertsEnabled;
    
    // Reset settings when toggling (either enabling or disabling)
    if (wasEnabled !== isNowEnabled) {
      console.log('🔔 Alert toggle detected - resetting settings:', wasEnabled, '→', isNowEnabled);
      
      // Reset all alert settings to defaults
      setStayOnTaskInterval(0);
      setSelectedAlertTaskId(null);
      setSelectedAlertTaskIds([]);
      setStayOnTaskModeSelected(false);
      setStayOnTaskRepeat(true);
      setStayOnTaskFallback('focused');
      setAlertMode('selective');
      
      // Clear alert config
      setAlertConfig(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('focusAlertConfig');
      }
    }
    
    prevAlertsEnabledRef.current = alertsEnabled;
  }, [alertsEnabled]);

  // Initialize timer with correct default settings when settings are loaded
  useEffect(() => {
    // Only run once when settings are first loaded (when defaultFocusDuration changes from initial 25 to actual value)
    if (mode !== 'focus') return;
    if (isRunning) return;
    if (currentBoardTask) return; // Don't override if there's an active task

    const effectiveDefaultMinutes =
      pomodoroDurationMode === 'customised' ? DEFAULT_FOCUS_MINUTES : defaultFocusDuration;

    const defaultSeconds = effectiveDefaultMinutes * 60;
    
    console.log('🔍 Timer Initialization Check:', {
      mode,
      pomodoroDurationMode,
      defaultFocusDuration,
      effectiveDefaultMinutes,
      currentSessionDuration: sessionDuration,
      expectedDefaultSeconds: defaultSeconds,
      needsUpdate: sessionDuration !== defaultSeconds
    });
    
    // Only update if the current timer doesn't match the expected default
    if (sessionDuration !== defaultSeconds) {
      console.log('⏱️ Initializing timer with default settings:', effectiveDefaultMinutes, 'min');
      setSessionDuration(defaultSeconds);
      setTimeLeft(defaultSeconds);
      setTimeInput(formatSecondsToInput(defaultSeconds));
    }
  }, [defaultFocusDuration, mode, isRunning, currentBoardTask, sessionDuration]);

  // When no task is selected (all tasks done), reset timer to default focus duration
  useEffect(() => {
    if (currentBoardTask) return;
    if (mode !== 'focus') return;

    const effectiveDefaultMinutes =
      pomodoroDurationMode === 'customised' ? DEFAULT_FOCUS_MINUTES : defaultFocusDuration;

    const defaultSeconds = effectiveDefaultMinutes * 60;
    console.log('⏱️ No active task - resetting timer to default focus duration:', effectiveDefaultMinutes, 'min');
    setSessionDuration(defaultSeconds);

    if (!isRunning) {
      setTimeLeft(defaultSeconds);
      setTimeInput(formatSecondsToInput(defaultSeconds));
    }
  }, [currentBoardTask, mode, defaultFocusDuration, isRunning, pomodoroDurationMode]);

  // Auto-select first incomplete task by sort order (dynamic current mission)
  useEffect(() => {
    if (boardTasks.length === 0) {
      if (currentBoardTask) {
        setCurrentBoardTask(null);
      }
      return;
    }

    const sortedTasks = [...boardTasks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const firstIncomplete = sortedTasks.find((task) => !task.completedAt);

    if (firstIncomplete) {
      if (!currentBoardTask || currentBoardTask.id !== firstIncomplete.id) {
        handleSelectCurrentTask(firstIncomplete.id);
      }
    } else if (currentBoardTask) {
      setCurrentBoardTask(null);
    }
  }, [taskSignature, currentBoardTask?.id]);

  // Clear currentBoardTask if it's no longer in boardTasks
  useEffect(() => {
    if (currentBoardTask && !boardTasks.some((task) => task.id === currentBoardTask.id)) {
      setCurrentBoardTask(null);
    }
  }, [boardTasks, currentBoardTask]);

  // Load project stats from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !projectId) return;
    const stored = window.localStorage.getItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Check if we need to update streak based on yesterday's activity
        const today = getTodayKey();
        const parsedLastActiveDate = parsed.lastActiveDate;
        
        if (parsedLastActiveDate && parsedLastActiveDate !== today) {
          // App was last used on a different day, check if streak should continue
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          // Only check if parsedLastActiveDate was yesterday
          if (parsedLastActiveDate === yesterday) {
            console.log('🔄 Checking yesterday activity for streak continuation...');
            
            // First check localStorage for yesterday's activity (primary)
            let yesterdayHadActivity = false;
            let yesterdayLongestStreak = 0;
            if (typeof window !== 'undefined') {
              const workedFlag = window.localStorage.getItem(`worked_${yesterday}`);
              yesterdayHadActivity = workedFlag === 'true';
              const storedStreak = window.localStorage.getItem(`longest_streak_${yesterday}`);
              yesterdayLongestStreak = storedStreak ? parseInt(storedStreak) || 0 : 0;
              console.log('📊 Yesterday activity from localStorage:', {
                date: yesterday,
                worked: yesterdayHadActivity,
                longestStreak: yesterdayLongestStreak
              });
            }
            
            // Double-check with API for verification (secondary)
            fetch(`/api/daily-achievements?projectId=${projectId}&date=${yesterday}`)
              .then(response => response.ok ? response.json() : null)
              .then(data => {
                const apiYesterdayWorked = (data?.data?.[0]?.focus_sessions || 0) > 0;
                const apiYesterdayStreak = data?.data?.[0]?.longest_streak || 0;
                console.log('📊 Yesterday activity from API:', {
                  worked: apiYesterdayWorked,
                  longestStreak: apiYesterdayStreak
                });
                
                // Use logical OR for activity check and max for streak
                const verifiedYesterdayWorked = yesterdayHadActivity || apiYesterdayWorked;
                const verifiedYesterdayStreak = Math.max(yesterdayLongestStreak, apiYesterdayStreak);
                
                const updatedStats = {
                  ...parsed,
                  lastActiveDate: today,
                };
                
                if (verifiedYesterdayWorked) {
                  // Yesterday was worked, continue streak
                  updatedStats.currentStreak = parsed.currentStreak + 1;
                  updatedStats.longestStreak = Math.max(updatedStats.longestStreak, verifiedYesterdayStreak, updatedStats.currentStreak);
                  console.log(`🔥 Streak continued: currentStreak ${parsed.currentStreak} → ${updatedStats.currentStreak}, longestStreak → ${updatedStats.longestStreak}`);
                } else {
                  // Yesterday was missed, reset streak
                  updatedStats.currentStreak = 0; // Will become 1 when they work today
                  updatedStats.longestStreak = Math.max(updatedStats.longestStreak, verifiedYesterdayStreak);
                  console.log(`💔 Streak reset: currentStreak ${parsed.currentStreak} → 0, longestStreak maintained at ${updatedStats.longestStreak}`);
                }
                
                // Save updated stats
                window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(updatedStats));
                setProjectStats(updatedStats);
                
                console.log('✅ Project stats updated for new day');
              })
              .catch(error => {
                console.warn('Failed to verify yesterday activity with API, using localStorage + activity assumption:', error);
                // Fallback: use localStorage + assume activity if user was active yesterday
                const assumedYesterdayWorked = parsedLastActiveDate === yesterday; // If they were using the app yesterday, assume they worked
                const verifiedYesterdayWorked = yesterdayHadActivity || assumedYesterdayWorked;
                
                const updatedStats = {
                  ...parsed,
                  lastActiveDate: today,
                };
                
                if (verifiedYesterdayWorked) {
                  updatedStats.currentStreak = parsed.currentStreak + 1;
                  updatedStats.longestStreak = Math.max(parsed.longestStreak, yesterdayLongestStreak, updatedStats.currentStreak);
                } else {
                  updatedStats.currentStreak = 0;
                  updatedStats.longestStreak = Math.max(parsed.longestStreak, yesterdayLongestStreak);
                }
                
                window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(updatedStats));
                setProjectStats(updatedStats);
                
                console.log('✅ Project stats updated with enhanced fallback');
              });
          } else {
            // Last active was not yesterday, just update lastActiveDate
            const updatedStats = { ...parsed, lastActiveDate: today };
            window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(updatedStats));
            setProjectStats(updatedStats);
          }
        } else {
          // Same day or no lastActiveDate, use as-is
          setProjectStats(parsed);
        }
        
        // Remove setStreakCount - UI uses projectStats.currentStreak directly
      } catch (error) {
        console.warn('Unable to parse project stats', error);
      }
    }
  }, [projectId]);

  // Load daily stats from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const today = getTodayKey();
    const stored = window.localStorage.getItem(`${DAILY_STATS_STORAGE_KEY}_${today}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDailyStats(parsed);
      } catch (error) {
        console.warn('Unable to parse daily stats', error);
      }
    }
  }, []);

  // Load session records from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SESSION_RECORDS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSessionRecords(parsed);
        } else {
          setSessionRecords([]);
        }
      } catch (error) {
        console.warn('Unable to parse session records', error);
        setSessionRecords([]);
      }
    }
  }, []);

  // Keep ref in sync with sessionRecords state
  useEffect(() => {
    sessionRecordsRef.current = sessionRecords;
  }, [sessionRecords]);

  // Load daily pomodoro count from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(DAILY_POMODORO_STORAGE_KEY);
    console.log('🔍 DEBUG: Loading daily pomodoro from localStorage:', stored);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const today = getTodayKey();
        console.log('🔍 DEBUG: Parsed localStorage data:', parsed);
        console.log('🔍 DEBUG: Today date:', today);
        console.log('🔍 DEBUG: Date comparison:', parsed.date === today);
        
        // Only load if it's from today, otherwise reset to 0
        if (parsed.date === today) {
          console.log('📥 Loaded daily pomodoro from localStorage:', parsed.count);
          setDailyPomodoro(parsed);
        } else {
          console.log('📅 New day detected, resetting daily pomodoro count');
          setDailyPomodoro({ date: today, count: 0 });
        }
      } catch (error) {
        console.warn('Unable to parse daily pomodoro', error);
      }
    } else {
      console.log('🔍 DEBUG: No daily pomodoro data in localStorage');
    }
  }, []);

  // Warn user before page refresh/close to prevent losing session data
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRunning || currentBoardTask) {
        event.preventDefault();
        event.returnValue = 'You have an active Pomodoro session. Are you sure you want to leave? Your progress and session data may be lost.';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, currentBoardTask]);

  // Load user settings from database
  useEffect(() => {
    const loadUserSettings = async () => {
      // First, try to load from localStorage (always works, no login required)
      try {
        const localSettings = localStorage.getItem('pomodoro_user_settings');
        if (localSettings) {
          const settings = JSON.parse(localSettings);
          console.log('✅ Loaded settings from localStorage');

          // Apply local settings to state
          console.log('📥 Loading settings from localStorage:', {
            pomodoro_duration_mode: settings.pomodoro_duration_mode,
            default_focus_duration: settings.default_focus_duration,
            default_short_break: settings.default_short_break,
            default_long_break: settings.default_long_break
          });
          
          if (settings.pomodoro_duration_mode) setPomodoroDurationMode(settings.pomodoro_duration_mode);
          if (settings.default_focus_duration) {
            setDefaultFocusDuration(settings.default_focus_duration);
            // Update ref to match loaded value to prevent false change detection
            previousFocusDurationRef.current = settings.default_focus_duration;
          }
          if (settings.default_short_break) setDefaultShortBreak(settings.default_short_break);
          if (settings.default_long_break) setDefaultLongBreak(settings.default_long_break);
          if (settings.timer_type) setSettingsTimerType(settings.timer_type);
          if (settings.countdown_minutes) setCountdownMinutes(settings.countdown_minutes);
          if (settings.auto_start_breaks !== undefined) setAutoStartBreaks(settings.auto_start_breaks);
          if (settings.auto_start_pomodoros !== undefined) setAutoStartPomodoros(settings.auto_start_pomodoros);
          if (settings.long_break_interval) setLongBreakInterval(settings.long_break_interval);
          if (settings.auto_check_tasks !== undefined) setAutoCheckTasks(settings.auto_check_tasks);
          if (settings.send_completed_to_bottom !== undefined) setSendCompletedToBottom(settings.send_completed_to_bottom);
          // Note: alerts_enabled is intentionally NOT restored from localStorage
          // Focus Alert checkbox should always be unchecked by default when app reopens
          if (settings.alert_frequency) setStayOnTaskInterval(settings.alert_frequency);
          if (settings.stay_on_task_repeat !== undefined) {
            setStayOnTaskRepeat(settings.stay_on_task_repeat);
            setStayOnTaskModeSelected(true); // If repeat mode is saved, mode was selected
          }
          if (settings.stay_on_task_fallback) setStayOnTaskFallback(settings.stay_on_task_fallback);
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }

      // Then, try to sync from database if authenticated (optional enhancement)
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          const dbSettings = data.data;

          if (dbSettings && dbSettings.default_focus_duration) {
            console.log('✅ Synced settings from database');

            // Database settings take precedence over local if they're more recent
            // For now, we'll keep localStorage as primary for offline functionality
            // TODO: Implement merge logic based on timestamps when needed
          }
        } else if (response.status === 401) {
          console.log('⚠️ Not logged in - using local settings only');
          console.log('💡 Log in at /auth/login to sync settings across devices');
        } else {
          console.warn('Failed to sync settings from database:', response.status);
        }
      } catch (error) {
        console.warn('Failed to sync from database (using local settings):', error);
      }
    };

    loadUserSettings();
  }, []);

  const saveUserSettings = async (settings: any) => {
    // Save to localStorage (this is now the primary storage)
    try {
      localStorage.setItem('pomodoro_user_settings', JSON.stringify(settings));
      console.log('✅ Settings saved to localStorage');
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }

    // TODO: Later we can add Supabase sync when user is logged in
    // For now, settings work entirely offline
  };

  // Helper function to recalculate tasks_completed from actual board tasks
  const recalculateTasksCompleted = useCallback(async () => {
    if (!projectId) return;

    const today = getTodayKey();
    
    // Count tasks that have completedAt timestamp from today
    const actualCompletedToday = boardTasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = task.completedAt.split('T')[0];
      return completedDate === today;
    }).length;

    console.log(`🔢 Recalculating tasks_completed: Found ${actualCompletedToday} tasks completed today`);

    // Update local state
    setDailyStats(prev => ({
      ...prev,
      tasksCompleted: actualCompletedToday
    }));

    // Sync corrected count to database using POST (replaces entire record)
    try {
      const response = await fetch('/api/daily-achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          date: today,
          focusSessions: dailyPomodoro.count,
          currentStreak: projectStats.currentStreak,
          longestStreak: projectStats.longestStreak,
          tasksCompleted: actualCompletedToday, // Use actual count
          tasksCreated: boardTasks.length,
          plannedHours: totalPlannedMinutes / 60,
          completedHours: dailyStats.hoursWorked,
          totalSessionTime: 0, // Will be calculated in main sync
          breakSessions: 0,
        }),
      });

      if (response.ok) {
        console.log(`✅ Fixed tasks_completed to ${actualCompletedToday} in database`);
      }
    } catch (error) {
      console.error('❌ Failed to fix tasks_completed:', error);
    }

    // Sync planned and completed hours for today
    await syncDailyHoursToDB(getTodayKey());
  }, [projectId, boardTasks, dailyPomodoro.count, projectStats, dailyStats.hoursWorked, totalPlannedMinutes, syncDailyHoursToDB]);

  // Helper function to delete daily achievements for fresh start
  const deleteDailyAchievements = useCallback(async (deleteAll: boolean = false) => {
    if (!projectId) return;

    const today = getTodayKey();
    const confirmMsg = deleteAll 
      ? 'Delete ALL daily achievements for this project?' 
      : `Delete today's (${today}) daily achievements?`;
    
    if (!confirm(confirmMsg)) {
      console.log('❌ Deletion cancelled');
      return;
    }

    try {
      // Delete from database via API
      const endpoint = deleteAll 
        ? `/api/daily-achievements?projectId=${projectId}&deleteAll=true`
        : `/api/daily-achievements?projectId=${projectId}&date=${today}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('✅ Daily achievements deleted from database');
        
        // Clear local storage
        localStorage.removeItem(`${DAILY_STATS_STORAGE_KEY}_${today}`);
        localStorage.removeItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`);
        localStorage.removeItem(DAILY_POMODORO_STORAGE_KEY);
        localStorage.removeItem(SESSION_RECORDS_STORAGE_KEY);
        
        // Reset state
        setDailyStats({
          date: today,
          tasksCompleted: 0,
          sessionsCompleted: 0,
          breakSessions: 0,
          hoursWorked: 0,
          targetTasks: 3,
          targetSessions: 8,
          targetHours: 4,
          achieved: false,
        });
        setDailyPomodoro({ date: today, count: 0 });
        setSessionRecords([]);
        setProjectStats({
          projectId: projectId || '',
          dailyGoals: {
            tasksPerDay: 3,
            sessionsPerDay: 8,
            hoursPerDay: 4,
          },
          weeklyGoals: {
            tasksPerWeek: 15,
            sessionsPerWeek: 40,
            hoursPerWeek: 20,
          },
          totalTasksCompleted: 0,
          totalSessionsCompleted: 0,
          totalHoursWorked: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
        });
        
        console.log('✅ Fresh start complete! All data reset.');
        alert('Fresh start complete! Page will reload.');
        window.location.reload();
      } else {
        console.error('❌ Failed to delete:', response.status);
        alert('Failed to delete. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Error deleting daily achievements:', error);
      alert('Error deleting. Check console for details.');
    }
  }, [projectId]);

  // Expose helper functions to window for manual operations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fixTasksCompleted = recalculateTasksCompleted;
      (window as any).deleteTodayData = () => deleteDailyAchievements(false);
      (window as any).deleteAllData = () => deleteDailyAchievements(true);
      console.log('🔧 Helper functions available:');
      console.log('  - window.fixTasksCompleted() - Fix tasks_completed count');
      console.log('  - window.deleteTodayData() - Delete today\'s achievements');
      console.log('  - window.deleteAllData() - Delete ALL achievements for this project');
    }
  }, [recalculateTasksCompleted, deleteDailyAchievements]);

  // Daily achievements sync to database
  const syncDailyAchievements = useCallback(async (forceSync: boolean = false) => {
    if (!projectId) return;

    try {
      const today = getTodayKey();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Removed "already synced today" check to allow multiple syncs per day
      // This ensures focus_sessions count updates with each completed session
      // POST API uses UPSERT, so last value wins - no data loss

      console.log('🔄 Starting daily achievements sync...');
      setSyncStatus('syncing');

      // Calculate total_session_time from actual focus session records
      // Use ref to access latest sessionRecords state
      const currentSessionRecords = sessionRecordsRef.current;
      console.log('🔍 Calculating total_session_time:', {
        totalSessionRecords: currentSessionRecords.length,
        today,
        sessionRecords: currentSessionRecords.map(r => ({
          startTime: r.startTime,
          type: r.type,
          duration: r.duration
        }))
      });
      
      const todayFocusSessions = currentSessionRecords.filter(record => 
        record.startTime.startsWith(today) && record.type === 'focus'
      );
      
      console.log('🔍 Filtered focus sessions:', {
        count: todayFocusSessions.length,
        sessions: todayFocusSessions.map(s => ({ duration: s.duration, type: s.type }))
      });
      
      const totalFocusTime = todayFocusSessions.reduce((sum, session) => sum + session.duration, 0);
      console.log('🔍 Total focus time calculated:', totalFocusTime);

      // Fetch yesterday's longest_streak to calculate today's properly
      let yesterdayLongestStreak = 0;
      try {
        const yesterdayResponse = await fetch(`/api/daily-achievements?projectId=${projectId}&date=${yesterday}`);
        if (yesterdayResponse.ok) {
          const yesterdayData = await yesterdayResponse.json();
          console.log('📅 Yesterday data fetch result:', {
            date: yesterday,
            responseOk: yesterdayResponse.ok,
            dataLength: yesterdayData.data?.length,
            yesterdayData: yesterdayData.data?.[0]
          });
          if (yesterdayData.data && yesterdayData.data.length > 0) {
            yesterdayLongestStreak = yesterdayData.data[0].longest_streak || 0;
            console.log('📊 Yesterday longest_streak loaded:', yesterdayLongestStreak);
          } else {
            console.log('⚠️ No yesterday data found in database');
          }
        } else {
          console.log('❌ Yesterday data fetch failed:', yesterdayResponse.status);
        }
      } catch (error) {
        console.warn('Could not fetch yesterday\'s longest_streak:', error);
      }

      // Recalculate streaks from full history to ensure accuracy
      console.log('🔄 Recalculating streaks from full history...');
      const recalculatedStreaks = await calculateStreakFromHistory(projectId, dailyPomodoro.count);
      console.log('✅ Recalculated streaks:', recalculatedStreaks);

      // Use the recalculated longest streak (which now includes the fix for off-by-one error)
      const calculatedLongestStreak = recalculatedStreaks.longestStreak;

      // Update projectStats with recalculated values
      if (calculatedLongestStreak > projectStats.longestStreak || recalculatedStreaks.currentStreak !== projectStats.currentStreak) {
        setProjectStats(prev => {
          const updated = {
            ...prev,
            currentStreak: recalculatedStreaks.currentStreak,
            longestStreak: calculatedLongestStreak,
          };
          // Save to localStorage
          if (typeof window !== 'undefined' && projectId) {
            window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(updated));
          }
          return updated;
        });
      }

      // Always save today's longest_streak and work activity to localStorage for tomorrow's reference
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`longest_streak_${today}`, calculatedLongestStreak.toString());
        window.localStorage.setItem(`worked_${today}`, dailyPomodoro.count > 0 ? 'true' : 'false');
      }

      // Collect all data from localStorage and state
      const syncData = {
        projectId,
        date: today,
        focusSessions: dailyPomodoro.count,
        currentStreak: recalculatedStreaks.currentStreak,
        longestStreak: calculatedLongestStreak,
        tasksCompleted: dailyStats.tasksCompleted,
        tasksCreated: boardTasks.length,
        plannedHours: totalPlannedMinutes / 60,
        completedHours: dailyStats.hoursWorked,
        totalSessionTime: Math.round(totalFocusTime),
        breakSessions: dailyStats.breakSessions, // Use direct count instead of calculation
        focused_alerts: dailyStats.focusedAlerts || 0,
        deviated_alerts: dailyStats.deviatedAlerts || 0,
        break_time: dailyStats.breakTime || 0,
        deviation_time: dailyStats.deviationTime || 0,
        focus_time: dailyStats.focusTime || 0,
        sessions: currentSessionRecords.filter(record => record.startTime.startsWith(today))
      };

      console.log('📊 Syncing data:', syncData);

      // Send to database
      try {
        const response = await fetch('/api/daily-achievements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(syncData),
        });

        if (response.ok) {
          console.log('✅ Daily achievements synced successfully');
          setSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString());
          // Removed localStorage tracking - we now allow multiple syncs per day
        } else if (response.status === 401) {
          // User not authenticated - skip sync gracefully
          console.log('🔐 User not authenticated, skipping database sync');
          setSyncStatus('idle');
        } else {
          console.error('❌ Failed to sync daily achievements:', response.status);
          setSyncStatus('error');
        }
      } catch (fetchError) {
        // Network error or fetch failed - log but don't crash
        console.warn('⚠️ Network error syncing daily achievements:', fetchError);
        console.log('💾 Data saved to localStorage, will retry sync later');
        setSyncStatus('idle'); // Set to idle instead of error to avoid alarming user
      }

    } catch (error) {
      console.error('❌ Error syncing daily achievements:', error);
      setSyncStatus('error');
    }
  }, [projectId, dailyPomodoro, projectStats, dailyStats, boardTasks, totalPlannedMinutes, defaultFocusDuration, setSyncStatus, setLastSyncTime]);

  // Sync to database after focus session completes
  // Trigger: dailyPomodoro.count changes (focus session completed)
  // Note: syncDailyAchievements has sessionRecords in its dependencies, so it will read the latest state
  useEffect(() => {
    // Skip initial load and zero counts
    if (dailyPomodoro.count === 0) return;
    if (!projectId) return;

    console.log('🔄 Focus session completed, triggering sync. Count:', dailyPomodoro.count);
    
    // Delay to ensure sessionRecords state has updated
    // syncDailyAchievements function has sessionRecords in its useCallback deps, so it reads latest value
    const syncTimer = setTimeout(() => {
      console.log('⏰ Sync timer fired, calling syncDailyAchievements...');
      syncDailyAchievements().catch(error => 
        console.error('❌ Failed to sync after session completion:', error)
      );
    }, 1500); // 1.5s delay to ensure all state updates complete

    return () => clearTimeout(syncTimer);
  }, [dailyPomodoro.count, projectId, syncDailyAchievements, dailyStats.sessionsCompleted]);

  // Sync localStorage data to database on page load/reload
  // DISABLED: The sessionRecords-based sync (above) is more reliable and prevents ECONNRESET errors
  // This auto-sync on page load was causing connection resets due to large payloads
  // The new sync triggers when sessionRecords updates, which is more accurate and timely
  /*
  useEffect(() => {
    if (typeof window === 'undefined' || !projectId) return;

    const syncLocalStorageToDatabase = async () => {
      const today = getTodayKey();
      
      // Get localStorage data
      const dailyStatsStored = window.localStorage.getItem(`${DAILY_STATS_STORAGE_KEY}_${today}`);
      const dailyPomodoroStored = window.localStorage.getItem(DAILY_POMODORO_STORAGE_KEY);
      const sessionRecordsStored = window.localStorage.getItem(SESSION_RECORDS_STORAGE_KEY);
      
      if (!dailyStatsStored && !dailyPomodoroStored && !sessionRecordsStored) {
        console.log('📭 No localStorage data to sync');
        return;
      }

      try {
        let tasksCompleted = 0;
        let focusSessions = 0;
        let totalSessionTime = 0;

        // Get tasks_completed from dailyStats
        if (dailyStatsStored) {
          const dailyStats = JSON.parse(dailyStatsStored);
          tasksCompleted = dailyStats.tasksCompleted || 0;
        }

        // Get focus_sessions from dailyPomodoro
        if (dailyPomodoroStored) {
          const dailyPomodoro = JSON.parse(dailyPomodoroStored);
          if (dailyPomodoro.date === today) {
            focusSessions = dailyPomodoro.count || 0;
          }
        }

        // Get total_session_time from sessionRecords
        if (sessionRecordsStored) {
          const sessionRecords = JSON.parse(sessionRecordsStored);
          if (Array.isArray(sessionRecords)) {
            const todayFocusSessions = sessionRecords.filter(
              r => r.startTime.startsWith(today) && r.type === 'focus'
            );
            totalSessionTime = todayFocusSessions.reduce((sum, r) => sum + r.duration, 0);
          }
        }

        // Only sync if there's data to sync
        if (tasksCompleted > 0 || focusSessions > 0 || totalSessionTime > 0) {
          console.log('🔄 Syncing localStorage to database on page load:', {
            tasksCompleted,
            focusSessions,
            totalSessionTime
          });

          // Trigger a full sync to update database
          setTimeout(() => {
            syncDailyAchievements(true).catch(error => 
              console.error('❌ Failed to sync localStorage to database:', error)
            );
          }, 1000); // Delay to ensure all state is loaded
        }
      } catch (error) {
        console.error('❌ Error syncing localStorage to database:', error);
      }
    };

    // Run sync after a short delay to ensure all localStorage data is loaded
    const syncTimer = setTimeout(syncLocalStorageToDatabase, 2000);
    return () => clearTimeout(syncTimer);
  }, [projectId, syncDailyAchievements]);
  */

  // Automatic daily sync at end of day (checks every hour)
  useEffect(() => {
    if (!projectId) return;

    const checkAndSync = async () => {
      const now = new Date();
      const today = getTodayKey();

      // Check if it's around midnight (11 PM to 1 AM) - sync window
      const hour = now.getHours();
      if (hour >= 23 || hour <= 1) {
        await syncDailyAchievements();
      }
    };

    // Check every hour
    const interval = setInterval(checkAndSync, 60 * 60 * 1000); // 1 hour

    // Removed initial check on mount to prevent ECONNRESET errors on page refresh
    // checkAndSync();

    return () => clearInterval(interval);
  }, [projectId, syncDailyAchievements]);

  // Sync on page visibility change (user returns to tab after being away)
  useEffect(() => {
    if (!projectId) return;

    let lastVisibleTime = Date.now();

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User left tab - record time
        lastVisibleTime = Date.now();
      } else {
        // User returned to tab - only sync if away for > 5 minutes
        const awayTimeMinutes = (Date.now() - lastVisibleTime) / 1000 / 60;
        if (awayTimeMinutes > 5) {
          console.log(`🔄 User returned after ${Math.round(awayTimeMinutes)} minutes - syncing...`);
          await syncDailyAchievements();
        } else {
          console.log(`⏭️ User returned after ${Math.round(awayTimeMinutes)} minutes - skipping sync (< 5 min)`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [projectId, syncDailyAchievements]);

  // Sync on beforeunload (browser close/logout)
  useEffect(() => {
    if (!projectId) return;

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Force sync before leaving
      try {
        await syncDailyAchievements(true);
      } catch (error) {
        console.warn('Failed to sync before unload:', error);
      }

      // Original warning logic
      if (isRunning || currentBoardTask) {
        event.preventDefault();
        event.returnValue = 'You have an active Pomodoro session. Are you sure you want to leave? Your progress and session data may be lost.';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, isRunning, currentBoardTask, syncDailyAchievements]);

  // Sync when date changes (user keeps app open across midnight)
  useEffect(() => {
    let lastDate = getTodayKey();

    const checkDateChange = () => {
      const currentDate = getTodayKey();
      if (currentDate !== lastDate) {
        console.log('📅 Date changed! Syncing previous day data...');
        syncDailyAchievements(true); // Force sync previous day
        lastDate = currentDate;

        // Check yesterday's activity to maintain streak properly
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        fetch(`/api/daily-achievements?projectId=${projectId}&date=${yesterday}`)
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            const yesterdayHadActivity = data?.data?.[0]?.focus_sessions > 0;
            console.log(`📊 Yesterday (${yesterday}) activity check:`, yesterdayHadActivity ? 'Active' : 'Inactive');

            setProjectStats(prev => {
              let newCurrentStreak = prev.currentStreak;
              if (yesterdayHadActivity) {
                // Yesterday was worked, so streak continues
                newCurrentStreak = prev.currentStreak + 1;
                console.log(`🔥 Streak continues: ${prev.currentStreak} → ${newCurrentStreak}`);
              } else {
                // Yesterday was missed, reset streak to 0 (will become 1 when they work today)
                newCurrentStreak = 0;
                console.log(`💔 Streak broken: ${prev.currentStreak} → ${newCurrentStreak}`);
              }

              const updated = {
                ...prev,
                currentStreak: newCurrentStreak,
              };

              // Save to localStorage
              if (typeof window !== 'undefined' && projectId) {
                window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(updated));
              }

              return updated;
            });
          })
          .catch(error => {
            console.warn('Failed to check yesterday activity:', error);
            // If we can't check, preserve current streak
          });

        // Reset daily counters for new day but preserve streak
        setDailyPomodoro({ date: currentDate, count: 0 });
        setDailyStats(prev => ({
          ...prev,
          date: currentDate,
          tasksCompleted: 0,
          sessionsCompleted: 0,
          breakSessions: 0, // Reset break sessions for new day
          hoursWorked: 0,
          achieved: false,
          breakTime: 0, // Reset break time for new day
          deviationTime: 0, // Reset deviation time for new day
          focusTime: 0, // Reset focus time for new day
        }));
        setSessionRecords([]); // Clear session records for new day
        // Note: currentStreak is now properly maintained above
      }
    };

    // Check every minute for date change
    const interval = setInterval(checkDateChange, 60 * 1000);
    return () => clearInterval(interval);
  }, [syncDailyAchievements]);

  // localStorage backup and recovery mechanism
  const createLocalStorageBackup = useCallback(() => {
    if (!projectId || typeof window === 'undefined') return;

    try {
      const backupKey = `backup_${projectId}_${getTodayKey()}`;
      const backupData = {
        timestamp: new Date().toISOString(),
        dailyPomodoro,
        projectStats,
        dailyStats,
        sessionRecords,
        boardTasks
      };

      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.log('💾 localStorage backup created');

      // Keep only last 7 days of backups
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`backup_${projectId}_`));
      if (keys.length > 7) {
        keys.sort().slice(0, keys.length - 7).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.warn('Failed to create localStorage backup:', error);
    }
  }, [projectId, dailyPomodoro, projectStats, dailyStats, sessionRecords, boardTasks]);

  const recoverFromDatabase = useCallback(async () => {
    if (!projectId) return;

    try {
      console.log('🔄 Attempting to recover data from database...');

      // Fetch daily achievements from database
      const response = await fetch(`/api/daily-achievements?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        const achievements = data.data || [];

        if (achievements.length > 0) {
          // Get the most recent achievement (should be today due to FIX 1)
          const latest = achievements[achievements.length - 1];

          // FIX 4: Use database current_streak directly instead of recalculating
          // The database current_streak is the authoritative source for today's streak
          const databaseCurrentStreak = latest.current_streak || 0;

          // Update streak display with database value
          // Remove setStreakCount - UI uses projectStats.currentStreak directly

          // Check if yesterday had activity to update streak for consecutive days
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const today = getTodayKey();
          
          if (latest.date === today) {
            // Latest data is for today, check if yesterday was consecutive
            try {
              const yesterdayResponse = await fetch(`/api/daily-achievements?projectId=${projectId}&date=${yesterday}`);
              if (yesterdayResponse.ok) {
                const yesterdayData = await yesterdayResponse.json();
                const yesterdayHadActivity = yesterdayData?.data?.[0]?.focus_sessions > 0;
                
                if (yesterdayHadActivity && databaseCurrentStreak > 0) {
                  // Yesterday had activity and today has activity, continue streak
                  const correctedCurrentStreak = databaseCurrentStreak + 1;
                  console.log(`🔥 Recovered streak corrected: ${databaseCurrentStreak} → ${correctedCurrentStreak}`);
                  
                  setProjectStats(prev => ({
                    ...prev,
                    currentStreak: correctedCurrentStreak,
                    longestStreak: Math.max(prev.longestStreak, correctedCurrentStreak),
                  }));
                }
              }
            } catch (error) {
              console.warn('Failed to check yesterday activity during recovery:', error);
            }
          }

          // Restore other stats using database values
          setProjectStats(prev => ({
            ...prev,
            currentStreak: databaseCurrentStreak, // This will be overridden above if streak was corrected
            longestStreak: Math.max(prev.longestStreak, databaseCurrentStreak), // Update longest if needed
            totalTasksCompleted: latest.tasks_completed || 0,
            totalSessionsCompleted: latest.focus_sessions || 0,
            totalHoursWorked: latest.completed_hours || 0,
            lastActiveDate: latest.date
          }));

          console.log('✅ Recovered data from database with streak:', databaseCurrentStreak);
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Failed to recover from database:', error);
    }

    return false;
  }, [projectId]);

  const checkAndRecoverData = useCallback(async () => {
    if (!projectId || typeof window === 'undefined') return;

    // Check if localStorage data exists
    const projectStatsKey = `${PROJECT_STATS_STORAGE_KEY}_${projectId}`;
    const dailyPomodoroKey = DAILY_POMODORO_STORAGE_KEY;
    const dailyStatsKey = `${DAILY_STATS_STORAGE_KEY}_${getTodayKey()}`;

    const hasProjectStats = localStorage.getItem(projectStatsKey);
    const hasDailyPomodoro = localStorage.getItem(dailyPomodoroKey);
    const hasDailyStats = localStorage.getItem(dailyStatsKey);

    // If all data is missing, try to recover from database
    if (!hasProjectStats && !hasDailyPomodoro && !hasDailyStats) {
      console.log('⚠️ localStorage appears empty, attempting recovery...');
      const recovered = await recoverFromDatabase();

      if (recovered) {
        // Save recovered data back to localStorage
        localStorage.setItem(projectStatsKey, JSON.stringify(projectStats));
        localStorage.setItem(dailyPomodoroKey, JSON.stringify(dailyPomodoro));
        localStorage.setItem(dailyStatsKey, JSON.stringify(dailyStats));
        console.log('💾 Recovered data saved back to localStorage');
      }
    }
  }, [projectId, projectStats, dailyPomodoro, dailyStats, recoverFromDatabase]);

  // Periodic backup (every 30 minutes)
  useEffect(() => {
    if (!projectId) return;

    const backupInterval = setInterval(createLocalStorageBackup, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(backupInterval);
  }, [projectId, createLocalStorageBackup]);

  // Check for data recovery on mount
  useEffect(() => {
    if (!projectId) return;

    // Small delay to let other useEffects run first
    const timer = setTimeout(checkAndRecoverData, 1000);
    return () => clearTimeout(timer);
  }, [projectId, checkAndRecoverData]);

  const commitTaskTimeInput = (taskId: string) => {
    const raw = taskTimeInputs[taskId];
    const minutes = parseClockToMinutes(raw);
    const task = boardTasks.find((t) => t.id === taskId);
    
    if (minutes === null) {
      setTaskTimeInputs((prev) => ({
        ...prev,
        [taskId]: formatMinutesToClock(task?.duration ?? 0),
      }));
      return;
    }
    
    // When customized mode is enabled, always set timerMode to 'customised' and use customFocusTime
    const updates = pomodoroDurationMode === 'customised'
      ? { timerMode: 'customised' as const, customFocusTime: minutes }
      : { duration: minutes };
    
    handleBoardTaskUpdate(taskId, updates);
    setTaskTimeInputs((prev) => ({ ...prev, [taskId]: formatMinutesToClock(minutes) }));
    
    if (currentBoardTask?.id === taskId) {
      if (pomodoroDurationMode === 'customised') {
        setCurrentBoardTask((prev) => (prev ? { ...prev, timerMode: 'customised', customFocusTime: minutes } : prev));
      } else {
        setCurrentBoardTask((prev) => (prev ? { ...prev, duration: minutes } : prev));
      }
      applyDuration(minutes * 60);
    }
  };

  const applyDuration = (seconds: number) => {
    const safe = clampTimerSeconds(seconds);
    setSessionDuration(safe);
    setTimeLeft(safe);
    setTimeInput(formatSecondsToInput(safe));
    setIsRunning(false);
    setActiveControl(null);
  };

  const handleThemeSelect = (preset: ThemePreset) => {
    setSelectedThemeId(preset.id);
    setThemeWallpaper(preset.wallpaperUrl);
    setTheme({
      id: preset.id,
      name: preset.title,
      wallpaper_url: preset.wallpaperUrl,
      swatches: preset.swatches,
    });
    setThemeDrawerOpen(false);
    const [primary = '#0f172a', secondary = '#0b1120', tertiary = '#22d3ee'] = preset.swatches || [];
    setCustomThemeColors({
      surface: hexToRgba(primary, 0.82),
      panel: hexToRgba(secondary, 0.88),
      border: hexToRgba('#ffffff', 0.08),
      chip: hexToRgba(tertiary, 0.18),
    });
  };

  const getFocusDurationForTask = useCallback((task?: BoardTaskCard | null) => {
    if (!task) {
      return defaultFocusDuration * 60;
    }

    // If global mode is 'default', always use default settings
    if (pomodoroDurationMode === 'default') {
      return defaultFocusDuration * 60;
    }

    // If global mode is 'customised', check task's custom settings
    if (pomodoroDurationMode === 'customised') {
      const minutes = task.customFocusTime ?? task.duration ?? defaultFocusDuration;
      return minutes * 60;
    }

    return defaultFocusDuration * 60;
  }, [defaultFocusDuration, pomodoroDurationMode]);

  const getFocusDuration = () => getFocusDurationForTask(currentBoardTask);

  const handleAlertResponse = useCallback(async (response: 'focused' | 'deviated') => {
    setAlertModalOpen(false);
    setCurrentAlertTask(null);

    // Calculate time based on alert frequency for both focused and deviated responses
    const alertFrequencyMinutes = alertConfig?.frequency || 0;
    const focusTimeToAdd = response === 'focused' ? alertFrequencyMinutes : 0;
    const deviationTimeToAdd = response === 'deviated' ? alertFrequencyMinutes : 0;

    // Update daily stats
    setDailyStats(prev => {
      const nextFocused = response === 'focused'
        ? (prev.focusedAlerts || 0) + 1
        : (prev.focusedAlerts || 0);

      const nextDeviated = response === 'deviated'
        ? (prev.deviatedAlerts || 0) + 1
        : (prev.deviatedAlerts || 0);

      const nextFocusTime = (prev.focusTime || 0) + focusTimeToAdd;
      const nextDeviationTime = (prev.deviationTime || 0) + deviationTimeToAdd;

      const newStats = {
        ...prev,
        focusedAlerts: nextFocused,
        deviatedAlerts: nextDeviated,
        focusTime: nextFocusTime,
        deviationTime: nextDeviationTime
      };

      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${DAILY_STATS_STORAGE_KEY}_${getTodayKey()}`, JSON.stringify(newStats));
      }

      return newStats;
    });

    console.log(`📊 Alert recorded: ${response}`, {
      focused: response === 'focused' ? (dailyStats.focusedAlerts || 0) + 1 : dailyStats.focusedAlerts || 0,
      deviated: response === 'deviated' ? (dailyStats.deviatedAlerts || 0) + 1 : dailyStats.deviatedAlerts || 0,
      focusTime: response === 'focused' 
        ? `${(dailyStats.focusTime || 0)} → ${(dailyStats.focusTime || 0) + focusTimeToAdd} minutes (+${focusTimeToAdd}m)`
        : `${dailyStats.focusTime || 0} minutes (unchanged)`,
      deviationTime: response === 'deviated' 
        ? `${(dailyStats.deviationTime || 0)} → ${(dailyStats.deviationTime || 0) + deviationTimeToAdd} minutes (+${deviationTimeToAdd}m)`
        : `${dailyStats.deviationTime || 0} minutes (unchanged)`,
      alertFrequency: alertFrequencyMinutes,
      task: currentAlertTask?.title
    });

    // Sync alerts to database
    await syncDailyHoursToDB();
  }, [currentAlertTask, dailyStats.focusedAlerts, dailyStats.deviatedAlerts, dailyStats.focusTime, dailyStats.deviationTime, alertConfig, syncDailyHoursToDB]);

  const getShortBreakDuration = () => {
    if (!currentBoardTask) {
      // No task selected, use default settings
      return defaultShortBreak * 60;
    }

    // If global mode is 'default', always use default settings
    if (pomodoroDurationMode === 'default') {
      return defaultShortBreak * 60;
    }

    // If global mode is 'customised', check task's custom settings
    if (pomodoroDurationMode === 'customised' && currentBoardTask.customShortBreak) {
      return currentBoardTask.customShortBreak * 60;
    }

    // Fallback to default settings
    return defaultShortBreak * 60;
  };

  const getLongBreakDuration = () => {
    if (!currentBoardTask) {
      // No task selected, use default settings
      return defaultLongBreak * 60;
    }

    // If global mode is 'default', always use default settings
    if (pomodoroDurationMode === 'default') {
      return defaultLongBreak * 60;
    }

    // If global mode is 'customised', check task's custom settings
    if (pomodoroDurationMode === 'customised' && currentBoardTask.customLongBreak) {
      return currentBoardTask.customLongBreak * 60;
    }

    // Fallback to default settings
    return defaultLongBreak * 60;
  };

  const handleAlertSettingsOpen = () => {
    // Always set selectedAlertTaskId to current task for accurate validation
    if (currentBoardTask?.id) {
      setSelectedAlertTaskId(currentBoardTask.id);
      console.log('🔔 Alert Settings Opened - Setting task to:', currentBoardTask.id, currentBoardTask.title);
    } else if (boardTasks.length > 0) {
      // Fallback to first task if no current task
      setSelectedAlertTaskId(boardTasks[0].id);
      console.log('🔔 Alert Settings Opened - No current task, using first task:', boardTasks[0].id, boardTasks[0].title);
    }
    setSettingsInitialTab('timer');
    setSettingsTabFocusSignal((prev) => prev + 1);
    setAlertSectionFocusSignal((prev) => prev + 1);
    setSettingsOpen(true);
  };

  const handleBoardStatusChange = (taskId: string, status: BoardTaskStatus) => {
    // Update task status only - tasks_completed is handled by Done/Undo buttons
    setBoardTasks((prev) => prev.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            completedAt: status === 'achieved' ? new Date().toISOString() : task.completedAt
          }
        : task
    ));
    // Removed automatic tasks_completed increment - only Done/Undo buttons should update this
  };

  const handleBoardTaskUpdate = async (taskId: string, updates: Partial<Omit<BoardTaskCard, 'id'>>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          updates,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        console.log('✅ Task updated successfully:', updatedTask.id);

        const currentTask = boardTasks.find(t => t.id === taskId);
        
        // Handle custom focus time for customized tasks
        const taskUpdates = { ...updates };
        
        // If duration is being updated and we're in customised mode, convert to customFocusTime
        if (updates.duration !== undefined && !updates.timerMode) {
          // Check if task is already customised or if we should make it customised
          if (currentTask?.timerMode === 'customised') {
            taskUpdates.customFocusTime = updates.duration;
            delete taskUpdates.duration;
          }
        }

        setBoardTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, ...taskUpdates } : task
          )
        );

        // Check if this is marking task as done (completedAt set)
        const isMarkingDone = updates.completedAt && !currentTask?.completedAt;
        
        // Check if this is undoing task (completedAt removed)
        const isUndoing = updates.completedAt === null && currentTask?.completedAt;

        // Handle Done button click - increment tasks_completed
        if (isMarkingDone) {
          console.log('✅ Task marked as done - incrementing tasks_completed');

          // Update daily stats
          setDailyStats(prev => {
            const newStats = {
              ...prev,
              tasksCompleted: prev.tasksCompleted + 1,
              achieved: false,
            };

            newStats.achieved = newStats.tasksCompleted >= newStats.targetTasks &&
                              newStats.sessionsCompleted >= newStats.targetSessions &&
                              newStats.hoursWorked >= newStats.targetHours;

            if (typeof window !== 'undefined') {
              window.localStorage.setItem(`${DAILY_STATS_STORAGE_KEY}_${getTodayKey()}`, JSON.stringify(newStats));
            }

            return newStats;
          });

          // Sync to database
          try {
            await fetch('/api/daily-achievements', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                date: getTodayKey(),
                tasksCompleted: 1,
              }),
            });
            console.log('✅ Synced +1 task to daily_achievements');
          } catch (error) {
            console.error('❌ Failed to sync task completion:', error);
          }
        }

        // Handle Undo button click - decrement tasks_completed
        if (isUndoing) {
          console.log('⏪ Task undone - decrementing tasks_completed');

          // Update daily stats
          setDailyStats(prev => {
            const newStats = {
              ...prev,
              tasksCompleted: Math.max(0, prev.tasksCompleted - 1),
              achieved: false,
            };

            newStats.achieved = newStats.tasksCompleted >= newStats.targetTasks &&
                              newStats.sessionsCompleted >= newStats.targetSessions &&
                              newStats.hoursWorked >= newStats.targetHours;

            if (typeof window !== 'undefined') {
              window.localStorage.setItem(`${DAILY_STATS_STORAGE_KEY}_${getTodayKey()}`, JSON.stringify(newStats));
            }

            return newStats;
          });

          // Sync to database (decrement)
          try {
            await fetch('/api/daily-achievements', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                date: getTodayKey(),
                tasksCompleted: -1,
              }),
            });
            console.log('✅ Synced -1 task to daily_achievements');
          } catch (error) {
            console.error('❌ Failed to sync task undo:', error);
          }
        }

        // Removed duplicate isManualCompletion logic - Done/Undo buttons handle tasks_completed

        // Show success toast
        // Note: Add toast notification here if you have a toast system
        console.log('✅ Task updated');
      } else {
        console.error('❌ Task update failed - Status:', response.status, 'URL:', response.url);

        // Try to get error details
        let errorData: Record<string, any> = {};
        try {
          errorData = await response.json();
          console.error('❌ Error data from API:', errorData);
        } catch (parseError) {
          console.error('❌ Could not parse error response as JSON:', parseError);
          console.error('❌ Raw response text:', await response.text());
        }

        const errorMessage = errorData?.error || `Failed to update task (HTTP ${response.status})`;
        console.error('❌ Final error message:', errorMessage);

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error updating task:', error);
      throw error;
    }
  };

  const handleAddBoardTask = async (task: Omit<BoardTaskCard, 'id'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.title,
          priority: task.priority,
          duration: task.timerMode === 'default' ? defaultFocusDuration : task.duration,
          status: task.status,
          projectId: projectId,
          targetSessions: task.targetSessions,
          dailyGoal: task.dailyGoal,
          timerMode: task.timerMode,
          customFocusTime: task.customFocusTime,
          customShortBreak: task.customShortBreak,
          customLongBreak: task.customLongBreak,
        }),
      });

      if (response.status === 201) {
        const createdTask = await response.json();
        console.log('✅ Task created successfully:', createdTask.id);
        setBoardTasks((prev) => [createdTask, ...prev]);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to create task:', errorData);
        throw new Error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('❌ Error creating task:', error);
      throw error;
    }
  };

  const handleDeleteBoardTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
        }),
      });

      if (response.status === 204) {
        console.log('✅ Task deleted successfully from database');
        setBoardTasks((prev) => prev.filter((task) => task.id !== taskId));
        if (currentBoardTask?.id === taskId) {
          setCurrentBoardTask(null);
        }
      } else if (response.status === 404) {
        console.error('❌ Task not found');
        setBoardTasks((prev) => prev.filter((task) => task.id !== taskId));
        if (currentBoardTask?.id === taskId) {
          setCurrentBoardTask(null);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Delete failed:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      throw error;
    }
  };

  const handleApplyTimerFromBoard = (task: BoardTaskCard) => {
    const durationSeconds = getFocusDuration();
    setMode('focus');
    setSessionPhase('focus');
    applyDuration(durationSeconds);
    setCurrentBoardTask(task);
    setTaskBoardOpen(false);
  };

  const handleModeChange = (nextMode: 'focus' | 'short' | 'long') => {
    console.log('🔄 Mode Change:', {
      from: mode,
      to: nextMode,
      pomodoroDurationMode,
      defaultFocusDuration,
      defaultShortBreak,
      defaultLongBreak,
      currentTask: currentBoardTask?.title
    });
    
    setMode(nextMode);
    setSessionPhase(nextMode === 'focus' ? 'focus' : 'break');
    let newDuration;
    if (nextMode === 'focus') {
      newDuration = getFocusDuration();
      console.log('⏱️ Focus duration calculated:', newDuration / 60, 'min');
    } else if (nextMode === 'short') {
      newDuration = getShortBreakDuration();
      console.log('⏱️ Short break duration calculated:', newDuration / 60, 'min');
    } else {
      newDuration = getLongBreakDuration();
      console.log('⏱️ Long break duration calculated:', newDuration / 60, 'min');
    }
    applyDuration(newDuration);
    if (nextMode === 'focus') {
      setCurrentBoardTask(null);
    }
  };

  const selectedPriority = currentBoardTask ? PRIORITY_META[currentBoardTask.priority] : null;
  const currentModeLabel =
    mode === 'focus' ? 'Focus sprint' : mode === 'short' ? 'Short break' : 'Long break';

  const handleSelectCurrentTask = (taskId: string) => {
    if (!taskId) {
      setCurrentBoardTask(null);
      return;
    }
    const selected = boardTasks.find((task) => task.id === taskId);
    if (selected) {
      setMode('focus');
      setSessionPhase('focus');
      setCurrentBoardTask(selected);
      const durationSeconds = getFocusDurationForTask(selected);
      applyDuration(durationSeconds);
    }
  };

  const handleTimeInputChange = (value: string) => {
    if (/^[0-9:]*$/.test(value)) {
      setTimeInput(value);
    }
  };

  const commitTimeInput = () => {
    const parsed = parseTimeInput(timeInput);
    if (parsed) {
      applyDuration(parsed);
    } else {
      setTimeInput(formatSecondsToInput(timeLeft));
    }
    setIsEditingTime(false);
  };

  const handleTimeInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitTimeInput();
      (event.currentTarget as HTMLInputElement).blur();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setTimeInput(formatSecondsToInput(timeLeft));
      setIsEditingTime(false);
      (event.currentTarget as HTMLInputElement).blur();
    }
  };

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(sessionDuration);
    }
    setSessionPhase('focus');
    setLastCompletedTask(null);
    sessionCompletedRef.current = false; // Reset flag for new session
    // Only track start time for focus sessions, not breaks
    if (mode === 'focus') {
      setSessionStartTime(new Date()); // Set/reset start time for new segment
      console.log(`▶️ Started/Resumed: accumulated so far: ${accumulatedSeconds.toFixed(1)}s`);
    } else {
      setSessionStartTime(null); // Ensure breaks don't have start time
    }
    setIsRunning(true);
    setActiveControl('play');
  };

  const handlePause = () => {
    // Accumulate elapsed time before pausing (only for focus sessions)
    if (mode === 'focus' && sessionStartTime) {
      const now = new Date();
      const elapsedSeconds = (now.getTime() - sessionStartTime.getTime()) / 1000;
      setAccumulatedSeconds(prev => prev + elapsedSeconds);
      console.log(`⏸️ Paused: accumulated ${elapsedSeconds.toFixed(1)}s, total: ${(accumulatedSeconds + elapsedSeconds).toFixed(1)}s`);
    }
    setIsRunning(false);
    setActiveControl('pause');
    setSessionStartTime(null); // Clear start time during pause
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration);
    setSessionPhase('focus');
    setLastCompletedTask(null);
    setActiveControl(null);
    // Clear all time tracking on reset - discards incomplete session
    setSessionStartTime(null);
    setAccumulatedSeconds(0);
    console.log('🔄 Reset: cleared all time tracking');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSettingsClose = async () => {
    console.log('🔧 handleSettingsClose called');
    console.log('  Alert Frequency (stayOnTaskInterval):', stayOnTaskInterval);
    console.log('  Focus Duration (defaultFocusDuration):', defaultFocusDuration);
    console.log('  Previous Focus Duration:', previousFocusDurationRef.current);
    console.log('  Current Timer (sessionDuration):', sessionDuration / 60, 'min');
    console.log('  Current Time Left:', timeLeft / 60, 'min');
    
    // Check if alerts are enabled and complete
    // Also check if there are tasks available
    // For selective mode, require at least one task selection; for common mode, don't require it
    const areAlertSettingsComplete = alertsEnabled && alertTaskOptions.length > 0 && (alertMode === 'common' || selectedAlertTaskIds.length > 0) && stayOnTaskInterval > 0 && stayOnTaskModeSelected;
    
    // Check if alert configuration actually changed
    let alertConfigChanged = false;
    if (areAlertSettingsComplete) {
      const focusAlertConfig = {
        taskId: alertMode === 'common' ? 'common' : selectedAlertTaskIds[0] || '',
        taskIds: alertMode === 'common' ? [] : selectedAlertTaskIds,
        frequency: stayOnTaskInterval,
        repeatMode: stayOnTaskRepeat ? "repeat" as const : "once" as const,
        defaultResponse: stayOnTaskFallback,
        enabled: true,
        mode: alertMode
      };

      // Compare with existing config
      const existingConfig = alertConfig;
      const taskIdsChanged = !existingConfig || 
        JSON.stringify(existingConfig.taskIds.sort()) !== JSON.stringify(focusAlertConfig.taskIds.sort());
      
      alertConfigChanged = !existingConfig || 
        existingConfig.taskId !== focusAlertConfig.taskId ||
        existingConfig.frequency !== focusAlertConfig.frequency ||
        existingConfig.repeatMode !== focusAlertConfig.repeatMode ||
        existingConfig.defaultResponse !== focusAlertConfig.defaultResponse ||
        existingConfig.mode !== focusAlertConfig.mode ||
        taskIdsChanged;

      // Save to localStorage and update state
      if (typeof window !== 'undefined') {
        localStorage.setItem('focusAlertConfig', JSON.stringify(focusAlertConfig));
        console.log('💾 Alert configuration saved to localStorage:', focusAlertConfig);
      }
      
      // Update the alert config state
      setAlertConfig(focusAlertConfig);

      // Only show toast if configuration actually changed
      if (alertConfigChanged) {
        let message = '';
        if (alertMode === 'common') {
          message = 'Alert configured for all tasks';
        } else {
          const count = selectedAlertTaskIds.length;
          message = `Alert configured for ${count} task${count > 1 ? 's' : ''}`;
        }

        setToastMessage(message);
        setToastVisible(true);

        setTimeout(() => {
          setToastVisible(false);
        }, 3000);
      }
    }
    
    // Save all settings to database when panel closes
    const settingsToSave = {
      timer_type: settingsTimerType,
      pomodoro_duration_mode: pomodoroDurationMode,
      default_focus_duration: defaultFocusDuration,
      default_short_break: defaultShortBreak,
      default_long_break: defaultLongBreak,
      countdown_minutes: countdownMinutes,
      auto_start_breaks: autoStartBreaks,
      auto_start_pomodoros: autoStartPomodoros,
      long_break_interval: longBreakInterval,
      auto_check_tasks: autoCheckTasks,
      send_completed_to_bottom: sendCompletedToBottom,
      alerts_enabled: alertsEnabled,
      alert_frequency: stayOnTaskInterval,
      stay_on_task_repeat: stayOnTaskRepeat,
      stay_on_task_fallback: stayOnTaskFallback,
    };

    saveUserSettings(settingsToSave);

    // Check if defaultFocusDuration actually changed
    const focusDurationChanged = previousFocusDurationRef.current !== defaultFocusDuration;
    console.log('  Focus Duration Changed?', focusDurationChanged);

    // Only update timer if Focus Duration actually changed
    if (focusDurationChanged) {
      console.log('  ⚠️ UPDATING TIMER because Focus Duration changed');

      const wasRunning = isRunning;

      // Reset running timer if settings changed and timer is active
      if (isRunning) {
        setIsRunning(false);
        setActiveControl(null);
        setSessionStartTime(null); // Clear start time
        setAccumulatedSeconds(0); // Reset accumulated time
      }

      // Update session duration if we're in focus mode and current task uses default settings
      if (mode === 'focus' && currentBoardTask && currentBoardTask.timerMode === 'default') {
        const newDuration = defaultFocusDuration * 60;
        console.log('  Setting new timer duration:', newDuration / 60, 'min');
        setSessionDuration(newDuration);
        setTimeLeft(newDuration);

        // If timer was running, restart it with new duration
        if (wasRunning) {
          console.log('  🔄 Restarting timer with new duration');
          setTimeout(() => {
            setSessionStartTime(new Date());
            setIsRunning(true);
            setActiveControl('play');
          }, 100); // Small delay to ensure state updates
        }
      }

      // Update the ref to track the new value
      previousFocusDurationRef.current = defaultFocusDuration;

      // Show toast notification
      setToastMessage(`Focus duration updated to ${defaultFocusDuration} minutes`);
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
      }, 3000);
    } else {
      console.log('  ✅ NOT updating timer - Focus Duration unchanged');
    }

    setSettingsOpen(false);
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed left-6 top-6 z-50">
        <button
          type="button"
          onClick={() => router.push('/dashboard/home')}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10/80 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-white/50 hover:bg-white/15"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {showInterface && (
        <div className="fixed right-6 top-6 z-50 flex flex-col items-end gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStatsOverlayOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10/80 px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-white/50 hover:bg-white/15"
              aria-label="View statistics"
            >
              <span className="text-base">📊</span>
              Stats
            </button>
            <button
              type="button"
              onClick={() => setTaskBoardOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10/80 px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-white/50 hover:bg-white/15"
              aria-label="Open task board"
            >
              <ListTodo className="h-4 w-4" />
              Task board
            </button>
            <button
              type="button"
              onClick={() => setMusicDrawerOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition ${
                musicDrawerOpen
                  ? 'border-emerald-300/60 bg-emerald-400/25'
                  : 'border-white/20 bg-white/10/80 hover:border-white/50 hover:bg-white/15'
              }`}
              aria-label="Open media player"
            >
              <Music className="h-4 w-4" />
              Player
            </button>
            <button
              type="button"
              onClick={() => setThemeDrawerOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition ${
                themeDrawerOpen
                  ? 'border-violet-300/60 bg-violet-400/25'
                  : 'border-white/20 bg-white/10/80 hover:border-white/50 hover:bg-white/15'
              }`}
              aria-label="Open theme selector"
            >
              <Palette className="h-4 w-4" />
              Theme
            </button>
            <button
              type="button"
              onClick={() => {
                // Disable alerts if no task is selected and alerts are not already configured
                if (!currentBoardTask?.id && selectedAlertTaskIds.length === 0) {
                  setAlertsEnabled(false);
                  console.log('🔔 Alerts disabled: No task selected when opening settings');
                }
                // Set selectedAlertTaskId to current task when opening settings
                if (currentBoardTask?.id) {
                  setSelectedAlertTaskId(currentBoardTask.id);
                } else if (boardTasks.length > 0) {
                  setSelectedAlertTaskId(boardTasks[0].id);
                }
                setSettingsOpen(true);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition ${
                settingsOpen
                  ? 'border-purple-300/60 bg-purple-400/25'
                  : 'border-white/20 bg-white/10/80 hover:border-white/50 hover:bg-white/15'
              }`}
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
          {project && (
            <div
              className={`inline-flex w-auto max-w-[15rem] flex-col rounded-2xl border border-white/15 bg-black/80 text-white shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ${
                projectWidgetOpen ? 'px-4 py-4' : 'px-2 py-1.5'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-white">Project Overview</p>
                  {projectWidgetOpen && (
                    <p className="text-sm font-semibold">{project.project_name}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setProjectWidgetOpen((prev) => !prev)}
                  className={`ml-1 rounded-full border border-white/20 text-white/80 transition hover:text-white hover:border-white/40 ${
                    projectWidgetOpen ? 'p-2' : 'p-1.5'
                  }`}
                  aria-expanded={projectWidgetOpen}
                  aria-label={projectWidgetOpen ? 'Collapse project overview' : 'Expand project overview'}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${projectWidgetOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className={`space-y-2 text-sm text-white/80 overflow-hidden transition-all duration-300 ${projectWidgetOpen ? 'mt-3 max-h-96 opacity-100' : 'mt-0 max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="flex justify-between gap-3">
                  <span className="text-white/50">Duration</span>
                  <span className="font-medium text-white text-right capitalize">{project.duration_type?.replace('_', ' ') ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/50">Start</span>
                  <span className="font-medium text-white text-right">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/50">End</span>
                  <span className="font-medium text-white text-right">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-[0.25em]">Weekdays</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {project.weekdays && project.weekdays.length > 0 ? project.weekdays.join(', ') : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <PlayAreaLayout
        wrapTop={false}
        showBackgroundLayers={false}
        styleOverrides={layoutStyle}
        top={
          <div className="space-y-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Play area</p>
                <h1 className="font-heading mt-1 text-3xl font-semibold text-white">Deep focus mission</h1>
                <p className="text-sm text-white/60">Select a planned mission and stay in rhythm.</p>
              </div>
            </div>

            {showInterface && (
              <div className="w-full max-w-4xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    {sessionPhase === 'break' ? (
                      <>
                        <p className="text-[10px] uppercase tracking-[0.45em] text-white/50" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>Break Time</p>
                        <div className="mt-1 flex items-center gap-3">
                          <h3 className="font-heading text-2xl font-semibold text-white" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                            Take a {mode === 'short' ? defaultShortBreak : defaultLongBreak}-minute break
                          </h3>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/60" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            Relax
                          </span>
                          <span>{mode === 'short' ? defaultShortBreak : defaultLongBreak}m break</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] uppercase tracking-[0.45em] text-white/50" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>Current mission</p>
                        <div className="mt-1 flex items-center gap-3">
                          <h3 className="font-heading text-2xl font-semibold text-white backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg px-3 py-1" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                            {currentBoardTask ? currentBoardTask.title : 'No mission selected'}
                          </h3>
                          <button
                            type="button"
                            aria-label="Edit mission"
                            onClick={() => setTaskBoardOpen(true)}
                            className={`inline-flex items-center justify-center text-white/70 transition hover:text-white`}
                          >
                            <PenSquare className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/60" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                          {currentBoardTask ? (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selectedPriority?.color ?? '#a5f3fc' }}></span>
                                {selectedPriority?.label ?? 'Planned'}
                              </span>
                              <span>{Math.floor(getFocusDuration() / 60)}m focus</span>
                            </>
                          ) : (
                            <span className="text-white/50" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>Pick a planned task to sync your Pomodro timer.</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div
                      className="inline-flex items-center gap-2 rounded-full border backdrop-blur-xl px-4 py-1.5 text-xs text-white/80"
                      style={chipStyle}
                    >
                      <span className="text-[10px] uppercase tracking-[0.4em] text-white/50">Total planned</span>
                      <span className="text-lg font-semibold text-white">{formatPlannedMinutes(totalPlannedMinutes)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-white/80">
                  <div
                    className="inline-flex items-center gap-2 rounded-full border backdrop-blur-xl px-3 py-1.5 text-sm"
                    style={chipStyle}
                  >
                    <span className="text-lg drop-shadow-[0_5px_18px_rgba(248,250,109,0.55)]">⚡</span>
                    <span className="text-base font-semibold text-white">{projectStats.currentStreak}</span>
                  </div>
                  <div
                    className="inline-flex items-center gap-2 rounded-full border backdrop-blur-xl px-3 py-1.5 text-sm"
                    style={chipStyle}
                  >
                    <span className="text-lg drop-shadow-[0_5px_15px_rgba(45,212,191,0.45)]">⏱️</span>
                    <span className="text-base font-semibold text-white">{dailyPomodoro.count}</span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      syncStatus === 'syncing' ? 'border-blue-300/60 bg-blue-400/25' :
                      syncStatus === 'success' ? 'border-green-300/60 bg-green-400/25' :
                      syncStatus === 'error' ? 'border-red-300/60 bg-red-400/25' :
                      'border-white/20 bg-white/10'
                    }`}
                    style={chipStyle}
                  >
                    {syncStatus === 'syncing' && <span className="text-lg">🔄</span>}
                    {syncStatus === 'success' && <span className="text-lg">✅</span>}
                    {syncStatus === 'error' && <span className="text-lg">❌</span>}
                    {syncStatus === 'idle' && <span className="text-lg">💾</span>}
                    <span className="text-xs uppercase tracking-[0.35em] text-white/50">
                      {syncStatus === 'syncing' ? 'Syncing' :
                       syncStatus === 'success' ? 'Synced' :
                       syncStatus === 'error' ? 'Sync Error' :
                       'Data Saved'}
                    </span>
                    {lastSyncTime && syncStatus === 'success' && (
                      <span className="text-xs text-white/70">{lastSyncTime}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
              <ModeTabs activeMode={mode} onChange={(m) => handleModeChange(m as typeof mode)} />
              <div
                className="inline-flex flex-col items-center gap-6 text-center"
                onMouseDown={handleMouseDown}
                style={{
                  cursor: isDragging ? 'grabbing' : 'grab',
                  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                }}
              >
                <div
                  className={`relative flex items-center justify-center rounded-full border p-6 shadow-[0_25px_60px_rgba(3,6,15,0.55)] ${theme?.wallpaper_url ? '' : 'backdrop-blur-2xl'}`}
                  style={timerStyle}
                >
                  <div className="absolute inset-0 rounded-full border border-white/10 opacity-40" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-60" />
                  <div className="relative">
                    <TimerCircle
                      timeLeft={timeLeft}
                      duration={Math.max(1, sessionDuration)}
                      modeLabel={currentModeLabel}
                      isRunning={isRunning}
                    />
                  </div>
                </div>
                <div className={`w-full max-w-sm ${theme?.wallpaper_url ? 'bg-gradient-to-b from-black/60 to-black/20 rounded-lg p-2' : ''}`}>
                  <TimerControls
                    isRunning={isRunning}
                    activeControl={activeControl}
                    onStart={handleStart}
                    onPause={handlePause}
                    onReset={handleReset}
                    onAlertSettings={handleAlertSettingsOpen}
                  />
                </div>
              </div>
            </div>
          </div>
        }
      />
      {hasActiveWallpaper && (
        <div className="pointer-events-auto fixed bottom-6 left-6 z-30">
          <a
            href="https://www.freepik.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/60 backdrop-blur-lg transition hover:border-white/35 hover:text-white"
          >
            <span className="text-white/40">Designed by</span>
            <span className="text-white">Freepik</span>
          </a>
        </div>
      )}
      <TodoTaskBoardModal
        open={showInterface && taskBoardOpen}
        tasks={boardTasks}
        onClose={() => setTaskBoardOpen(false)}
        onStatusChange={handleBoardStatusChange}
        onTaskUpdate={handleBoardTaskUpdate}
        onAddTask={handleAddBoardTask}
        onApplyTimer={handleApplyTimerFromBoard}
        currentTaskId={currentBoardTask?.id ?? null}
        onDeleteTask={handleDeleteBoardTask}
        projectId={projectId}
        onTasksLoaded={(tasks) => setBoardTasks(tasks)}
        onRefresh={debouncedFetchBoardTasks}
        showTimerEdit={pomodoroDurationMode === 'customised'}
      />
      <MediaPlayer
        open={showInterface && musicDrawerOpen}
        onClose={() => setMusicDrawerOpen(false)}
        positionClass="fixed right-6 top-40 lg:top-36 2xl:top-32"
      />
      <ThemeDrawer
        open={showInterface && themeDrawerOpen}
        onClose={() => setThemeDrawerOpen(false)}
        currentThemeId={selectedThemeId}
        onSelect={handleThemeSelect}
        positionClass="fixed right-[11rem] top-24"
      />
      <CalendarDrawer
        open={showInterface && isCalendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
      <QuickNoteModal
        open={showInterface && isNoteOpen}
        onClose={() => setNoteOpen(false)}
        content={noteContent}
        onChange={setNoteContent}
      />
      <FocusAlertModal
        isOpen={alertModalOpen}
        onResponse={handleAlertResponse}
        defaultResponse={alertConfig?.defaultResponse || 'focused'}
        taskName={currentAlertTask?.name || 'Focus Task'}
      />
      <StatsModal
        isOpen={statsOverlayOpen}
        onClose={() => setStatsOverlayOpen(false)}
        lastActiveDate={projectStats.lastActiveDate}
        statsData={statsData}
        projectStats={projectStats}
        refreshStats={loadStats}
      />
      <Toast message={toastMessage} visible={toastVisible} />
      {/* Floating control buttons */}
      <div className="fixed bottom-4 right-16 z-40 flex flex-col gap-2">
        <button
          onClick={() => setShowInterface(!showInterface)}
          className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          aria-label={showInterface ? "Hide interface" : "Show interface"}
        >
          {showInterface ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
        {showInterface && (
          <button
            onClick={() => document.documentElement.requestFullscreen()}
            className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            aria-label="Enter fullscreen"
          >
            <Expand className="h-5 w-5" />
          </button>
        )}
      </div>
      {/* Frequency Change Confirmation Dialog */}
      {frequencyConfirmDialogOpen && pendingFrequencyChange && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-black/80 p-6 shadow-2xl backdrop-blur-2xl">
            {/* Header */}
            <div className="mb-4 text-center">
              <h2 className="text-lg font-semibold text-white">Change Alert Frequency</h2>
              <p className="text-sm text-white/70">
                Timer is currently {isRunning ? 'running' : 'paused'}. How would you like to apply the frequency change?
              </p>
            </div>

            {/* Options */}
            <div className="mb-6 space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-emerald-400/50 bg-emerald-400/10 p-4 transition hover:border-emerald-400 hover:bg-emerald-400/20">
                <input
                  type="radio"
                  name="frequencyApplyMode"
                  value="immediate"
                  checked={pendingFrequencyChange.applyImmediately}
                  onChange={() => setPendingFrequencyChange(prev => prev ? {...prev, applyImmediately: true} : null)}
                  className="h-4 w-4 border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-400">Apply Immediately</p>
                  <p className="text-xs text-white/70">Reset alerts for current session</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-blue-400/50 bg-blue-400/10 p-4 transition hover:border-blue-400 hover:bg-blue-400/20">
                <input
                  type="radio"
                  name="frequencyApplyMode"
                  value="next"
                  checked={!pendingFrequencyChange.applyImmediately}
                  onChange={() => setPendingFrequencyChange(prev => prev ? {...prev, applyImmediately: false} : null)}
                  className="h-4 w-4 border-white/20 bg-transparent text-blue-500 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-400">Apply to Next Session</p>
                  <p className="text-xs text-white/70">Keep current session unchanged</p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleFrequencyCancel}
                className="flex-1 rounded-lg border border-white/20 bg-white/5 py-3 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFrequencyConfirm(pendingFrequencyChange.applyImmediately)}
                className="flex-1 rounded-lg border border-emerald-400/50 bg-emerald-400/10 py-3 text-sm font-medium text-emerald-400 transition hover:border-emerald-400 hover:bg-emerald-400/20"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      <SettingsPanel
        open={settingsOpen}
        onClose={handleSettingsClose}
        timerType={settingsTimerType}
        onTimerTypeChange={setSettingsTimerType}
        stayOnTaskInterval={stayOnTaskInterval}
        onStayOnTaskIntervalChange={handleStayOnTaskIntervalChange}
        stayOnTaskRepeat={stayOnTaskRepeat}
        onStayOnTaskRepeatChange={setStayOnTaskRepeat}
        stayOnTaskModeSelected={stayOnTaskModeSelected}
        onStayOnTaskModeSelected={setStayOnTaskModeSelected}
        stayOnTaskFallback={stayOnTaskFallback}
        onStayOnTaskFallbackChange={setStayOnTaskFallback}
        alertTaskOptions={alertTaskOptions}
        selectedAlertTaskId={selectedAlertTaskId}
        selectedAlertTaskIds={selectedAlertTaskIds}
        onAlertTaskSelect={(taskId) => setSelectedAlertTaskId(taskId || null)}
        onAlertTaskIdsSelect={setSelectedAlertTaskIds}
        alertsEnabled={alertsEnabled}
        onAlertsEnabledChange={setAlertsEnabled}
        alertMode={alertMode}
        onAlertModeChange={setAlertMode}
        initialTab={settingsInitialTab}
        tabFocusSignal={settingsTabFocusSignal}
        focusAlertSectionSignal={alertSectionFocusSignal}
        pomodoroDurationMode={pomodoroDurationMode}
        onPomodoroDurationModeChange={setPomodoroDurationMode}
        defaultFocusDuration={defaultFocusDuration}
        onDefaultFocusDurationChange={handleDefaultFocusDurationChange}
        defaultShortBreak={defaultShortBreak}
        onDefaultShortBreakChange={setDefaultShortBreak}
        defaultLongBreak={defaultLongBreak}
        onDefaultLongBreakChange={setDefaultLongBreak}
        currentTaskDuration={currentTaskDuration}
      />
      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
