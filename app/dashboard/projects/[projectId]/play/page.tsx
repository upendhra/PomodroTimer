'use client';

import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ListTodo, 
  Maximize2, 
  Minimize2, 
  Music, 
  Palette, 
  PenSquare, 
  Settings, 
  Timer 
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PlayAreaLayout from '@/components/playarea/PlayAreaLayout';
import TimerCircle from '@/components/playarea/TimerCircle';
import ModeTabs from '@/components/playarea/ModeTabs';
import TimerControls from '@/components/playarea/TimerControls';
import TodoTaskBoardModal from '@/components/playarea/TodoTaskBoardModal';
import { BoardTaskCard, BoardTaskStatus, PRIORITY_META, ProjectStats, DailyStats, SessionRecord } from '@/components/playarea/types';
import MusicDrawer from '@/components/project/MusicDrawer';
import ThemeDrawer, { ThemePreset } from '@/components/theme/ThemeDrawer';
import ProjectViewSwitch from '@/components/project/ProjectViewSwitch';
import CalendarDrawer from '@/components/project/CalendarDrawer';
import QuickNoteModal from '@/components/project/QuickNoteModal';

import SettingsPanel, { type TimerMode, type StayOnTaskFallback, type SettingsTabId } from '@/components/playarea/SettingsPanel';

const MODE_CONFIG = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
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

const getTodayKey = () => new Date().toISOString().split('T')[0];

const formatPlannedMinutes = (totalMinutes: number) => {
  if (totalMinutes <= 0 || Number.isNaN(totalMinutes)) return '0h';
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
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  const debouncedFetchBoardTasks = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchBoardTasks();
    }, 500);
  }, []);
  const [streakCount, setStreakCount] = useState(3);
  const [timeInput, setTimeInput] = useState(formatSecondsToInput(MODE_CONFIG.focus));
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [activeControl, setActiveControl] = useState<'play' | 'pause' | null>(null);
  const [taskTimeInputs, setTaskTimeInputs] = useState<Record<string, string>>({});
  const [showInterface, setShowInterface] = useState(true);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isNoteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('<p>Write your reflections...</p>');
  const [dailyPomodoro, setDailyPomodoro] = useState<{ date: string; count: number }>(() => ({
    date: getTodayKey(),
    count: 0,
  }));
  const [themeColors, setThemeColors] = useState({
    surface: 'rgba(2,4,12,0.95)',
    panel: 'rgba(8,11,22,0.9)',
    border: 'rgba(255,255,255,0.08)',
    chip: 'rgba(255,255,255,0.08)',
  });

  const layoutStyle = useMemo(() => ({
    backgroundColor: themeColors.surface,
  }), [themeColors.surface]);

  const panelStyle = useMemo(() => ({
    backgroundColor: themeColors.panel,
    borderColor: themeColors.border,
  }), [themeColors.panel, themeColors.border]);

  const chipStyle = useMemo(() => ({
    backgroundColor: themeColors.chip,
    borderColor: themeColors.border,
  }), [themeColors.chip, themeColors.border]);
  const alertTaskOptions = useMemo(
    () => boardTasks.map((task) => ({ id: task.id, title: task.title })),
    [boardTasks],
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTimerType, setSettingsTimerType] = useState<TimerMode>('pomodoro');
  const [stayOnTaskInterval, setStayOnTaskInterval] = useState(5);
  const [stayOnTaskRepeat, setStayOnTaskRepeat] = useState(true);
  const [stayOnTaskModeSelected, setStayOnTaskModeSelected] = useState(false);
  const [stayOnTaskFallback, setStayOnTaskFallback] = useState<StayOnTaskFallback>('focused');
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('timer');
  const [settingsTabFocusSignal, setSettingsTabFocusSignal] = useState(0);
  const [alertSectionFocusSignal, setAlertSectionFocusSignal] = useState(0);
  const [selectedAlertTaskId, setSelectedAlertTaskId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastCompletedTask, setLastCompletedTask] = useState<BoardTaskCard | null>(null);

  // Stats tracking state
  const [projectStats, setProjectStats] = useState<ProjectStats>(() => ({
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
    currentStreak: 0,
    longestStreak: 0,
    totalTasksCompleted: 0,
    totalSessionsCompleted: 0,
    totalHoursWorked: 0,
    lastActiveDate: getTodayKey(),
  }));

  const [dailyStats, setDailyStats] = useState<DailyStats>(() => ({
    date: getTodayKey(),
    tasksCompleted: 0,
    sessionsCompleted: 0,
    hoursWorked: 0,
    targetTasks: 3,
    targetSessions: 8,
    targetHours: 4,
    achieved: false,
  }));

  const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>([]);

  const plannedTaskOptions = boardTasks.filter((task) => task.status !== 'achieved' && !task.completedAt);
  const totalPlannedMinutes = plannedTaskOptions.reduce((sum, task) => sum + task.duration, 0);

  // Move recordSessionCompletion here, before it's used
  const recordSessionCompletion = useCallback(() => {
    const today = getTodayKey();
    setDailyPomodoro((prev) => {
      const next = {
        date: today,
        count: prev.date === today ? prev.count + 1 : 1,
      };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DAILY_POMODORO_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // Move handleSessionComplete here, after all state is defined
  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    setActiveControl(null);
    recordSessionCompletion();

    // Calculate streak properly - consecutive days of activity
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setProjectStats(prev => {
      let newStreak = prev.currentStreak;

      // Check if we had activity yesterday
      const hadActivityYesterday = prev.lastActiveDate === yesterday;
      const alreadyActiveToday = prev.lastActiveDate === today;

      if (hadActivityYesterday && !alreadyActiveToday) {
        // Continue streak - yesterday was active, today is new
        newStreak = prev.currentStreak + 1;
      } else if (!hadActivityYesterday && !alreadyActiveToday) {
        // New streak starting today
        newStreak = 1;
      } else {
        // Already active today or some other case, keep current streak
        newStreak = prev.currentStreak;
      }

      const newStats = {
        ...prev,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastActiveDate: today,
      };

      // Save to localStorage
      if (typeof window !== 'undefined' && projectId) {
        window.localStorage.setItem(`${PROJECT_STATS_STORAGE_KEY}_${projectId}`, JSON.stringify(newStats));
      }

      return newStats;
    });

    // Record session details
    const sessionStart = new Date(Date.now() - (sessionDuration * 1000));
    const sessionEnd = new Date();
    const sessionDurationMinutes = sessionDuration / 60;

    const sessionRecord: SessionRecord = {
      id: crypto.randomUUID(),
      taskId: currentBoardTask?.id || '',
      taskTitle: currentBoardTask?.title || 'No task',
      startTime: sessionStart.toISOString(),
      endTime: sessionEnd.toISOString(),
      duration: sessionDurationMinutes,
      type: mode,
      completed: true,
    };

    setSessionRecords(prev => {
      const updated = [...prev, sessionRecord];
      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SESSION_RECORDS_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    if (currentBoardTask) {
      // Mark current task as achieved
      setBoardTasks((prev) =>
        prev.map((task) => (task.id === currentBoardTask.id ? { ...task, status: 'achieved' } : task))
      );

      // Update task session count and actual duration
      const currentSessions = currentBoardTask.sessionsCompleted || 0;
      const currentActualDuration = currentBoardTask.actualDuration || 0;
      const newSessions = currentSessions + (mode === 'focus' ? 1 : 0);
      const newActualDuration = currentActualDuration + (mode === 'focus' ? sessionDurationMinutes : 0);

      setBoardTasks((prev) =>
        prev.map((task) =>
          task.id === currentBoardTask.id
            ? {
                ...task,
                sessionsCompleted: newSessions,
                actualDuration: newActualDuration,
                completedAt: mode === 'focus' ? sessionEnd.toISOString() : task.completedAt,
              }
            : task
        )
      );

      // Update daily stats
      setDailyStats(prev => {
        const newStats = {
          ...prev,
          sessionsCompleted: prev.sessionsCompleted + 1,
          hoursWorked: prev.hoursWorked + (sessionDurationMinutes / 60),
          tasksCompleted: mode === 'focus' && currentBoardTask.status === 'todo' ? prev.tasksCompleted + 1 : prev.tasksCompleted,
          achieved: false, // Recalculate below
        };

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

      // Update project stats
      setProjectStats(prev => {
        const newProjectStats = {
          ...prev,
          totalSessionsCompleted: prev.totalSessionsCompleted + 1,
          totalHoursWorked: prev.totalHoursWorked + (sessionDurationMinutes / 60),
          totalTasksCompleted: mode === 'focus' && currentBoardTask.status === 'todo' ? prev.totalTasksCompleted + 1 : prev.totalTasksCompleted,
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

      // Auto-progress to next task
      if (mode === 'focus') {
        // After focus session, go to short break but keep the task for reference
        setMode('short');
        const newDuration = MODE_CONFIG.short;
        setSessionDuration(newDuration);
        setTimeLeft(newDuration);
        setTimeInput(formatSecondsToInput(newDuration));
        setIsRunning(true); // Auto-start the short break
        setActiveControl('play');
        // Don't clear currentBoardTask here - keep it for short break completion
      } else if (mode === 'short') {
        // After short break, stop the session - user can manually start next task
        setCurrentBoardTask(null);
        setLastCompletedTask(null);
        // Don't auto-start next task - let user choose what to do next
      }
    }
  }, [recordSessionCompletion, currentBoardTask, mode, boardTasks, sessionDuration, projectId]);
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
        setProjectStats(parsed);
        setStreakCount(parsed.currentStreak || 0); // Initialize streak display
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
        setSessionRecords(parsed);
      } catch (error) {
        console.warn('Unable to parse session records', error);
      }
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

  useEffect(() => {
    if (projectId) {
      fetchBoardTasks();
    }
  }, [projectId]);

  const handleTaskTimeInputChange = (taskId: string, value: string) => {
    if (!/^[0-9:]*$/.test(value)) return;
    setTaskTimeInputs((prev) => ({ ...prev, [taskId]: value }));
  };

  const commitTaskTimeInput = (taskId: string) => {
    const raw = taskTimeInputs[taskId];
    const minutes = parseClockToMinutes(raw);
    if (minutes === null) {
      setTaskTimeInputs((prev) => ({
        ...prev,
        [taskId]: formatMinutesToClock(boardTasks.find((task) => task.id === taskId)?.duration ?? 0),
      }));
      return;
    }
    handleBoardTaskUpdate(taskId, { duration: minutes });
    setTaskTimeInputs((prev) => ({ ...prev, [taskId]: formatMinutesToClock(minutes) }));
    if (currentBoardTask?.id === taskId) {
      setCurrentBoardTask((prev) => (prev ? { ...prev, duration: minutes } : prev));
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

  const handleThemeSelect = (theme: ThemePreset) => {
    setSelectedThemeId(theme.id);
    setThemeWallpaper(theme.wallpaperUrl);
    setThemeDrawerOpen(false);
    const [primary = '#0f172a', secondary = '#0b1120', tertiary = '#22d3ee'] = theme.swatches || [];
    setThemeColors({
      surface: hexToRgba(primary, 0.82),
      panel: hexToRgba(secondary, 0.88),
      border: hexToRgba('#ffffff', 0.08),
      chip: hexToRgba(tertiary, 0.18),
    });
  };

  const handleModeChange = (nextMode: 'focus' | 'short' | 'long') => {
    setMode(nextMode);
    const newDuration = MODE_CONFIG[nextMode];
    applyDuration(newDuration);
    setCurrentBoardTask(null);
  };

  const handleAlertSettingsOpen = () => {
    if (currentBoardTask?.id) {
      setSelectedAlertTaskId(currentBoardTask.id);
    }
    setSettingsInitialTab('timer');
    setSettingsTabFocusSignal((prev) => prev + 1);
    setAlertSectionFocusSignal((prev) => prev + 1);
    setSettingsOpen(true);
  };

  const handleBoardStatusChange = (taskId: string, status: BoardTaskStatus) => {
    setBoardTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
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
        setBoardTasks((prev) => prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        ));
        // Show success toast
        // Note: Add toast notification here if you have a toast system
        console.log('✅ Task updated');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to update task:', errorData);
        throw new Error(errorData.error || 'Failed to update task');
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
          duration: task.duration,
          status: task.status,
          projectId: projectId,
          targetSessions: task.targetSessions,
          dailyGoal: task.dailyGoal,
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
    const durationSeconds = task.duration * 60;
    setMode('focus');
    applyDuration(durationSeconds);
    setCurrentBoardTask(task);
    setTaskBoardOpen(false);
  };

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
      setCurrentBoardTask(selected);
      applyDuration(selected.duration * 60);
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
    setIsRunning(true);
    setActiveControl('play');
  };

  const handlePause = () => {
    setIsRunning(false);
    setActiveControl('pause');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration);
    setActiveControl(null);
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

  return (
    <div className="relative min-h-screen">
      <div
        className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500 ${
            themeWallpaper ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: themeWallpaper ? `url(${themeWallpaper})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/35 to-black/65" />

      <div className="fixed left-6 top-6 z-50">
        <button
          type="button"
          onClick={() => (projectId ? router.push(`/dashboard/projects/${projectId}`) : router.back())}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10/80 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-white/50 hover:bg-white/15"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {showInterface && (
        <div className="fixed right-6 top-6 z-50 flex items-center gap-3">
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
            aria-label="Open music selector"
          >
            <Music className="h-4 w-4" />
            Music
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
            onClick={() => setSettingsOpen(true)}
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
              <div className="flex w-full justify-center">
                <ProjectViewSwitch projectId={projectId ?? ''} activeView="play" />
              </div>
            )}

            {showInterface && (
              <div
                className="mx-auto w-full max-w-4xl rounded-2xl border p-5 backdrop-blur-xl"
                style={panelStyle}
              >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-[0.45em] text-white/50">Current mission</p>
                  <div className="mt-1 flex items-center gap-3">
                    <h3 className="font-heading text-2xl font-semibold text-white">
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
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/60">
                    {currentBoardTask ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selectedPriority?.color ?? '#a5f3fc' }}></span>
                          {selectedPriority?.label ?? 'Planned'}
                        </span>
                        <span>{currentBoardTask.duration}m focus</span>
                      </>
                    ) : (
                      <span className="text-white/50">Pick a planned task to sync your Pomodro timer.</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs text-white/80"
                    style={chipStyle}
                  >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-white/50">Total planned</span>
                    <span className="text-lg font-semibold text-white">{formatPlannedMinutes(totalPlannedMinutes)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-white/80">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                  style={chipStyle}
                >
                  <span className="text-lg drop-shadow-[0_5px_18px_rgba(248,250,109,0.55)]">⚡</span>
                  <span className="text-xs uppercase tracking-[0.35em] text-white/50">Streak</span>
                  <span className="text-base font-semibold text-white">{streakCount}</span>
                </div>
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                  style={chipStyle}
                >
                  <span className="text-lg drop-shadow-[0_5px_15px_rgba(45,212,191,0.45)]">⏱️</span>
                  <span className="text-xs uppercase tracking-[0.35em] text-white/50">Daily Pomos</span>
                  <span className="text-base font-semibold text-white">{dailyPomodoro.count}</span>
                </div>
              </div>
            </div>
            )}

            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
              <ModeTabs activeMode={mode} onChange={(m) => handleModeChange(m as typeof mode)} />
              <div className="inline-flex flex-col items-center gap-6 text-center">
                <div
                  className="relative flex items-center justify-center rounded-full border p-6 shadow-[0_25px_60px_rgba(3,6,15,0.55)] backdrop-blur-2xl"
                  style={panelStyle}
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
                <div className="w-full max-w-sm">
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
      />
      <MusicDrawer
        open={showInterface && musicDrawerOpen}
        onClose={() => setMusicDrawerOpen(false)}
        currentTrackId={currentTrackId}
        positionClass="fixed right-6 top-24"
        onTrackSelect={(track) => setCurrentTrackId(track?.id ?? null)}
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
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3 text-white">
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur transition hover:border-white/40 ${
            isFullscreen ? 'border-emerald-300/70 text-emerald-100' : ''
          }`}
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowInterface((prev) => {
              const next = !prev;
              if (!next) {
                setMusicDrawerOpen(false);
                setTaskBoardOpen(false);
                setThemeDrawerOpen(false);
                setCalendarOpen(false);
                setNoteOpen(false);
              }
              return next;
            });
          }}
          className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white shadow-[0_10px_45px_rgba(0,0,0,0.55)] backdrop-blur transition hover:border-white/50"
          aria-label={showInterface ? 'Hide interface' : 'Show interface'}
        >
          {showInterface ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6 text-cyan-200" />}
        </button>
      </div>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        timerType={settingsTimerType}
        onTimerTypeChange={setSettingsTimerType}
        stayOnTaskInterval={stayOnTaskInterval}
        onStayOnTaskIntervalChange={setStayOnTaskInterval}
        stayOnTaskRepeat={stayOnTaskRepeat}
        onStayOnTaskRepeatChange={setStayOnTaskRepeat}
        stayOnTaskModeSelected={stayOnTaskModeSelected}
        onStayOnTaskModeSelected={setStayOnTaskModeSelected}
        stayOnTaskFallback={stayOnTaskFallback}
        onStayOnTaskFallbackChange={setStayOnTaskFallback}
        alertTaskOptions={alertTaskOptions}
        selectedAlertTaskId={selectedAlertTaskId}
        onAlertTaskSelect={(taskId) => setSelectedAlertTaskId(taskId || null)}
        initialTab={settingsInitialTab}
        tabFocusSignal={settingsTabFocusSignal}
        focusAlertSectionSignal={alertSectionFocusSignal}
      />
    </div>
  );
}
