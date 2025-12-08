'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, ListTodo, Maximize2, Minimize2, Music, Palette, PenSquare, Settings, Timer } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import PlayAreaLayout from '@/components/playarea/PlayAreaLayout';
import TimerCircle from '@/components/playarea/TimerCircle';
import ModeTabs from '@/components/playarea/ModeTabs';
import TimerControls from '@/components/playarea/TimerControls';
import TaskBoardModal from '@/components/playarea/TaskBoardModal';
import SettingsPanel from '@/components/playarea/SettingsPanel';
import { BoardTaskCard, BoardTaskStatus, PRIORITY_META } from '@/components/playarea/types';
import MusicDrawer from '@/components/project/MusicDrawer';
import ThemeDrawer, { ThemePreset } from '@/components/theme/ThemeDrawer';
import ProjectViewSwitch from '@/components/project/ProjectViewSwitch';
import CalendarDrawer from '@/components/project/CalendarDrawer';
import QuickNoteModal from '@/components/project/QuickNoteModal';

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
const getTodayKey = () => new Date().toISOString().split('T')[0];

const formatPlannedMinutes = (totalMinutes: number) => {
  if (totalMinutes <= 0 || Number.isNaN(totalMinutes)) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const mockBoardTasks: BoardTaskCard[] = [
  { id: 'board-1', title: 'Moodboard hero frames', priority: 'high', duration: 45, status: 'todo' },
  { id: 'board-2', title: 'Audio cleanup', priority: 'medium', duration: 25, status: 'todo' },
  { id: 'board-3', title: 'Client recap notes', priority: 'low', duration: 15, status: 'achieved' },
];

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
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [sessionDuration, setSessionDuration] = useState(MODE_CONFIG.focus);
  const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
  const [boardTasks, setBoardTasks] = useState<BoardTaskCard[]>(mockBoardTasks);
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [themeWallpaper, setThemeWallpaper] = useState<string | null>(null);
  const [currentBoardTask, setCurrentBoardTask] = useState<BoardTaskCard | null>(null);
  const [streakCount, setStreakCount] = useState(3);
  const [timeInput, setTimeInput] = useState(formatSecondsToInput(MODE_CONFIG.focus));
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [activeControl, setActiveControl] = useState<'play' | 'pause' | null>(null);
  const [missionEditorOpen, setMissionEditorOpen] = useState(false);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const plannedTaskOptions = boardTasks.filter((task) => task.status !== 'achieved');
  const totalPlannedMinutes = plannedTaskOptions.reduce((sum, task) => sum + task.duration, 0);

  useEffect(() => {
    setTaskTimeInputs((prev) => {
      const next: Record<string, string> = {};
      boardTasks.forEach((task) => {
        next[task.id] = prev[task.id] ?? formatMinutesToClock(task.duration);
      });
      return next;
    });
  }, [boardTasks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(DAILY_POMODORO_STORAGE_KEY);
    const today = getTodayKey();
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.date === today) {
          setDailyPomodoro({ date: parsed.date, count: Number(parsed.count) || 0 });
          return;
        }
      } catch (error) {
        console.warn('Unable to parse daily pomodoro progress', error);
      }
    }
    const resetRecord = { date: today, count: 0 };
    window.localStorage.setItem(DAILY_POMODORO_STORAGE_KEY, JSON.stringify(resetRecord));
    setDailyPomodoro(resetRecord);
  }, []);

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

  const handleBoardStatusChange = (taskId: string, status: BoardTaskStatus) => {
    setBoardTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const handleBoardTaskUpdate = (taskId: string, updates: Partial<Omit<BoardTaskCard, 'id'>>) => {
    setBoardTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
  };

  const handleAddBoardTask = (task: Omit<BoardTaskCard, 'id'>) => {
    setBoardTasks((prev) => [...prev, { ...task, id: crypto.randomUUID() }]);
  };

  const handleDeleteBoardTask = (taskId: string) => {
    setBoardTasks((prev) => prev.filter((task) => task.id !== taskId));
    if (currentBoardTask?.id === taskId) {
      setCurrentBoardTask(null);
    }
  };

  const handleApplyTimerFromBoard = (task: BoardTaskCard) => {
    const durationSeconds = task.duration * 60;
    setMode('focus');
    applyDuration(durationSeconds);
    setCurrentBoardTask(task);
    setTaskBoardOpen(false);
  };

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    setActiveControl(null);
    setStreakCount((count) => count + 1);
    recordSessionCompletion();
    if (currentBoardTask) {
      setBoardTasks((prev) =>
        prev.map((task) => (task.id === currentBoardTask.id ? { ...task, status: 'achieved' } : task))
      );
      setCurrentBoardTask(null);
    }
  }, [recordSessionCompletion, currentBoardTask]);

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

  const commitTimeInput = () => {
    const parsed = parseTimeInput(timeInput);
    if (parsed) {
      applyDuration(parsed);
    } else {
      setTimeInput(formatSecondsToInput(timeLeft));
    }
    setIsEditingTime(false);
  };

  const handleTimeInputChange = (value: string) => {
    if (/^[0-9:]*$/.test(value)) {
      setTimeInput(value);
    }
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
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleSelectCurrentTask = (taskId: string, closeEditor = false) => {
    if (!taskId) {
      setCurrentBoardTask(null);
      if (closeEditor) setMissionEditorOpen(false);
      return;
    }
    const selected = boardTasks.find((task) => task.id === taskId);
    if (selected) {
      setMode('focus');
      setCurrentBoardTask(selected);
      applyDuration(selected.duration * 60);
      if (closeEditor) setMissionEditorOpen(false);
    }
  };

  const selectedPriority = currentBoardTask ? PRIORITY_META[currentBoardTask.priority] : null;
  const currentModeLabel =
    mode === 'focus' ? 'Focus sprint' : mode === 'short' ? 'Short break' : 'Long break';

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
            onClick={() => setSettingsOpen((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition ${
              settingsOpen
                ? 'border-blue-300/60 bg-blue-400/25'
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
                <p className="text-sm font-medium text-white/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Play area</p>
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
              <div className="mx-auto w-full max-w-4xl">
                <div className="relative rounded-[28px] bg-gradient-to-r from-white/10 via-cyan-400/30 to-purple-500/30 p-[1px] shadow-[0_25px_80px_rgba(8,12,30,0.65)]">
                  <div
                    className="relative overflow-hidden rounded-[26px] border p-5 backdrop-blur-xl"
                    style={panelStyle}
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-[26px]">
                      <div className="absolute inset-0 rounded-[26px] bg-gradient-to-b from-white/12 via-transparent to-white/8 opacity-40" />
                      <div className="absolute inset-y-0 left-0 w-1/2 rounded-[26px] bg-gradient-to-r from-white/15 via-white/5 to-transparent opacity-40 blur-[40px]" />
                      <div className="absolute inset-0 rounded-[26px] border border-white/5 opacity-30" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Current Mission</p>
                          <div className="mt-1 flex items-center gap-3">
                            <h3 className="font-heading text-2xl font-semibold text-white">
                              {currentBoardTask ? currentBoardTask.title : 'No mission selected'}
                            </h3>
                            <button
                              type="button"
                              aria-label="Edit mission"
                              onClick={() => setMissionEditorOpen((prev) => !prev)}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:scale-105 ${
                                missionEditorOpen
                                  ? 'border-cyan-400/60 bg-cyan-400/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                                  : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10 hover:text-white'
                              }`}
                              title="Edit current mission"
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
                            <span className="text-xs font-medium text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Total Planned</span>
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
                          <span className="text-sm font-semibold text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Streak</span>
                          <span className="text-base font-semibold text-white">{streakCount}</span>
                        </div>
                        <div
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                          style={chipStyle}
                        >
                          <span className="text-lg drop-shadow-[0_5px_15px_rgba(45,212,191,0.45)]">⏱️</span>
                          <span className="text-sm font-semibold text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Daily Pomos</span>
                          <span className="text-base font-semibold text-white">{dailyPomodoro.count}</span>
                        </div>
                      </div>
                      {missionEditorOpen && (
                        <div className="mt-4 rounded-[24px] bg-gradient-to-r from-white/15 via-emerald-400/20 to-cyan-400/20 p-[1px] shadow-[0_20px_60px_rgba(3,6,15,0.55)]">
                          <div className="relative rounded-[22px] border p-4 backdrop-blur-xl" style={panelStyle}>
                            <div className="pointer-events-none absolute inset-0 rounded-[22px]">
                              <div className="absolute inset-0 rounded-[22px] bg-gradient-to-b from-white/12 via-transparent to-white/5 opacity-45" />
                              <div className="absolute inset-x-0 top-0 h-1/2 rounded-[22px] bg-gradient-to-b from-white/20 via-transparent to-transparent opacity-35" />
                              <div className="absolute inset-0 rounded-[22px] border border-white/5 opacity-30" />
                            </div>
                            <div className="relative z-10">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Planned Tasks</p>
                                <button
                                  type="button"
                                  onClick={() => setMissionEditorOpen(false)}
                                  className="text-xs text-white/60 hover:text-white"
                                >
                                  Close
                                </button>
                              </div>
                              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                                {plannedTaskOptions.map((task) => (
                                  <div
                                    key={task.id}
                                    className={`rounded-2xl border px-4 py-3 text-sm transition ${
                                      currentBoardTask?.id === task.id
                                        ? 'border-emerald-300/70 bg-emerald-400/10 text-white'
                                        : 'border-white/10 bg-white/5/40 text-white/80 hover:border-white/30'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <button
                                        type="button"
                                        onClick={() => handleSelectCurrentTask(task.id, true)}
                                        className="text-left"
                                      >
                                        <div className="font-medium text-white">{task.title}</div>
                                        <p className="text-[11px] text-white/50">{PRIORITY_META[task.priority].label}</p>
                                      </button>
                                      <div className="flex items-center gap-2">
                                        <label htmlFor={`task-timer-${task.id}`} className="text-xs font-medium text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                          Timer
                                        </label>
                                        <input
                                          id={`task-timer-${task.id}`}
                                          type="text"
                                          value={taskTimeInputs[task.id] ?? formatMinutesToClock(task.duration)}
                                          onChange={(event) => handleTaskTimeInputChange(task.id, event.target.value)}
                                          onBlur={() => commitTaskTimeInput(task.id)}
                                          onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                              event.preventDefault();
                                              commitTaskTimeInput(task.id);
                                              (event.currentTarget as HTMLInputElement).blur();
                                            }
                                            if (event.key === 'Escape') {
                                              event.preventDefault();
                                              setTaskTimeInputs((prev) => ({
                                                ...prev,
                                                [task.id]: formatMinutesToClock(task.duration),
                                              }));
                                              (event.currentTarget as HTMLInputElement).blur();
                                            }
                                          }}
                                          className="w-20 rounded-xl border border-white/20 bg-black/30 px-2 py-1 text-center text-sm text-white/90 focus:border-white/60 focus:outline-none"
                                          placeholder="MM:SS"
                                          inputMode="numeric"
                                          aria-label={`Edit timer for ${task.title}`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {!plannedTaskOptions.length && (
                                  <p className="text-xs text-white/50">No planned tasks available. Use the task board to plan your missions.</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setMissionEditorOpen(false);
                                  setTaskBoardOpen(true);
                                }}
                                className="mt-4 inline-flex items-center justify-center rounded-full border border-dashed border-white/30 px-4 py-2 text-xs text-white/80 hover:border-white/60"
                              >
                                Open task board
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                  />
                </div>
              </div>
            </div>
          </div>
        }
      />
      <TaskBoardModal
        open={showInterface && taskBoardOpen}
        tasks={boardTasks}
        onClose={() => setTaskBoardOpen(false)}
        onStatusChange={handleBoardStatusChange}
        onTaskUpdate={handleBoardTaskUpdate}
        onAddTask={handleAddBoardTask}
        onApplyTimer={handleApplyTimerFromBoard}
        currentTaskId={currentBoardTask?.id ?? null}
        onDeleteTask={handleDeleteBoardTask}
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
      <SettingsPanel
        open={showInterface && settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-[0_8px_25px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:border-white/50 hover:bg-black/50"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowInterface((prev) => {
              const next = !prev;
              if (!next) {
                setMissionEditorOpen(false);
                setMusicDrawerOpen(false);
                setTaskBoardOpen(false);
                setThemeDrawerOpen(false);
                setCalendarOpen(false);
                setNoteOpen(false);
                setSettingsOpen(false);
              }
              return next;
            });
          }}
          className="text-white"
          aria-label={showInterface ? 'Hide interface' : 'Show interface'}
        >
          <span
            className={`inline-flex h-16 w-16 items-center justify-center text-4xl ${
              showInterface
                ? 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]'
                : 'text-cyan-200 drop-shadow-[0_0_35px_rgba(59,225,255,0.85)]'
            }`}
            aria-hidden
          >
            {showInterface ? '👁️' : '🙈'}
          </span>
        </button>
      </div>
    </div>
  );
}
