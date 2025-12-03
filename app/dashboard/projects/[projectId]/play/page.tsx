'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Flame, ListTodo, Music, Palette } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import PlayAreaLayout from '@/components/playarea/PlayAreaLayout';
import TimerCircle from '@/components/playarea/TimerCircle';
import ModeTabs from '@/components/playarea/ModeTabs';
import TimerControls from '@/components/playarea/TimerControls';
import TaskBoardModal from '@/components/playarea/TaskBoardModal';
import { BoardTaskCard, BoardTaskStatus, PRIORITY_META } from '@/components/playarea/types';
import MusicDrawer from '@/components/project/MusicDrawer';
import ThemeDrawer, { ThemePreset } from '@/components/theme/ThemeDrawer';

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

const parseTimeInput = (value: string) => {
  const [mins, secs] = value.split(':');
  if (mins === undefined || secs === undefined || mins === '' || secs === '') return null;
  const minutesNum = Number(mins);
  const secondsNum = Number(secs);
  if (Number.isNaN(minutesNum) || Number.isNaN(secondsNum)) return null;
  return minutesNum * 60 + secondsNum;
};

const clampTimerSeconds = (value: number) => Math.min(MAX_TIMER_SECONDS, Math.max(MIN_TIMER_SECONDS, value));

const mockBoardTasks: BoardTaskCard[] = [
  { id: 'board-1', title: 'Moodboard hero frames', priority: 'high', duration: 45, status: 'todo' },
  { id: 'board-2', title: 'Audio cleanup', priority: 'medium', duration: 25, status: 'planned' },
  { id: 'board-3', title: 'Client recap notes', priority: 'low', duration: 15, status: 'achieved' },
];

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

  const plannedTaskOptions = boardTasks.filter((task) => task.status !== 'achieved');

  const applyDuration = (seconds: number) => {
    const safe = clampTimerSeconds(seconds);
    setSessionDuration(safe);
    setTimeLeft(safe);
    setTimeInput(formatSecondsToInput(safe));
    setIsRunning(false);
  };

  const handleThemeSelect = (theme: ThemePreset) => {
    setSelectedThemeId(theme.id);
    setThemeWallpaper(theme.wallpaperUrl);
    setThemeDrawerOpen(false);
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

  const handleApplyTimerFromBoard = (task: BoardTaskCard) => {
    const durationSeconds = task.duration * 60;
    setMode('focus');
    applyDuration(durationSeconds);
    setCurrentBoardTask(task);
    setTaskBoardOpen(false);
  };

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setStreakCount((count) => count + 1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

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
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration);
  };

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
      </div>
      <PlayAreaLayout
        wrapTop={false}
        showBackgroundLayers={false}
        top={
          <div className="space-y-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Play area</p>
                <h1 className="font-heading mt-1 text-3xl font-semibold text-white">Deep focus mission</h1>
                <p className="text-sm text-white/60">Select a planned mission and stay in rhythm.</p>
              </div>
              <div className="flex items-center gap-4 rounded-[28px] border border-white/15 bg-black/25 px-5 py-3 shadow-[0_15px_40px_rgba(5,6,18,0.45)] backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-orange-500 text-[#0b1220] shadow-inner shadow-amber-500/40">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.55em] text-white/60">Flow streak</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-white">{streakCount}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/90">Keep glowing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/10 bg-black/30/70 p-5 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.45em] text-white/50">Current mission</p>
                  <h3 className="font-heading mt-1 text-xl font-semibold text-white">
                    {currentBoardTask ? currentBoardTask.title : 'Select a planned task'}
                  </h3>
                  <p className="text-[11px] text-white/50">
                    {currentBoardTask
                      ? `${selectedPriority?.label ?? 'Planned'} · ${currentBoardTask.duration}m`
                      : 'Tap a mission chip or open the board.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-sm text-white/80">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/50">Timer</span>
                  <input
                    value={timeInput}
                    onChange={(e) => handleTimeInputChange(e.target.value)}
                    onBlur={commitTimeInput}
                    onKeyDown={handleTimeInputKeyDown}
                    onFocus={() => setIsEditingTime(true)}
                    placeholder="25:00"
                    className="w-16 border-none bg-transparent text-lg font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 overflow-x-auto">
                {plannedTaskOptions.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelectCurrentTask(task.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      currentBoardTask?.id === task.id
                        ? 'border-emerald-300/70 bg-emerald-400/15 text-white'
                        : 'border-white/15 bg-white/5 text-white/70 hover:border-white/40'
                    }`}
                  >
                    {task.title}
                    <span className="ml-2 text-white/40">{task.duration}m</span>
                  </button>
                ))}
                {!plannedTaskOptions.length && (
                  <p className="text-xs text-white/40">No planned tasks yet—open the board.</p>
                )}
                <button
                  type="button"
                  onClick={() => setTaskBoardOpen(true)}
                  className="rounded-full border border-dashed border-white/20 px-3 py-1 text-xs text-white/70 hover:border-white/40"
                >
                  Open board
                </button>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
              <ModeTabs activeMode={mode} onChange={(m) => handleModeChange(m as typeof mode)} />
              <div className="inline-flex flex-col items-center gap-6 text-center">
                <div className="relative flex items-center justify-center rounded-full border border-white/15 bg-black/35 p-6 shadow-[0_25px_60px_rgba(3,6,15,0.55)] backdrop-blur-2xl">
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
                  <TimerControls isRunning={isRunning} onStart={handleStart} onPause={handlePause} onReset={handleReset} />
                </div>
              </div>
            </div>
          </div>
        }
      />
      <TaskBoardModal
        open={taskBoardOpen}
        tasks={boardTasks}
        onClose={() => setTaskBoardOpen(false)}
        onStatusChange={handleBoardStatusChange}
        onTaskUpdate={handleBoardTaskUpdate}
        onAddTask={handleAddBoardTask}
        onApplyTimer={handleApplyTimerFromBoard}
      />
      <MusicDrawer
        open={musicDrawerOpen}
        onClose={() => setMusicDrawerOpen(false)}
        currentTrackId={currentTrackId}
        positionClass="fixed right-6 top-24"
        onTrackSelect={(track) => setCurrentTrackId(track?.id ?? null)}
      />
      <ThemeDrawer
        open={themeDrawerOpen}
        onClose={() => setThemeDrawerOpen(false)}
        currentThemeId={selectedThemeId}
        onSelect={handleThemeSelect}
        positionClass="fixed right-[11rem] top-24"
      />
    </div>
  );
}
