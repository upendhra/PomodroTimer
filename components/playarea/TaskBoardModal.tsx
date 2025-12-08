'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock3,
  GripVertical,
  Pencil,
  Plus,
  Target,
  TimerReset,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BoardTaskCard, BoardTaskStatus, PRIORITY_META, TaskPriority } from './types';

interface TaskBoardModalProps {
  open: boolean;
  tasks: BoardTaskCard[];
  onClose: () => void;
  onStatusChange: (taskId: string, status: BoardTaskStatus) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Omit<BoardTaskCard, 'id'>>) => void;
  onAddTask: (task: Omit<BoardTaskCard, 'id'>) => void;
  onApplyTimer?: (task: BoardTaskCard) => void;
  currentTaskId?: string | null;
  onDeleteTask: (taskId: string) => void;
}

type ColumnMeta = {
  key: BoardTaskStatus;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  badgeClass: string;
  iconClass: string;
  accentBar: string;
  accentBorder: string;
};

const COLUMN_CONFIG: ColumnMeta[] = [
  {
    key: 'todo',
    label: 'To do',
    subtitle: 'Backlog ideas',
    icon: ClipboardList,
    badgeClass: 'border-amber-300/70 bg-amber-400/10 text-amber-50 shadow-[0_0_25px_rgba(251,191,36,0.25)]',
    iconClass: 'text-amber-200',
    accentBar: 'bg-amber-400/60',
    accentBorder: 'border-l-4 border-l-amber-300/80',
  },
  {
    key: 'achieved',
    label: 'Achieved tasks',
    subtitle: 'Wins & ship logs',
    icon: Trophy,
    badgeClass: 'border-sky-300/70 bg-sky-400/10 text-sky-50 shadow-[0_0_25px_rgba(14,165,233,0.3)]',
    iconClass: 'text-sky-200',
    accentBar: 'bg-sky-300/80',
    accentBorder: 'border-l-4 border-l-emerald-300/80',
  },
];

const COLUMN_CARD_STYLES: Record<BoardTaskStatus, { card: string; collapsed: string }> = {
  todo: {
    card: 'border-amber-200/70 bg-amber-300/5',
    collapsed: 'border-amber-200/60 bg-amber-300/5',
  },
  achieved: {
    card: 'border-emerald-200/70 bg-emerald-300/5',
    collapsed: 'border-emerald-200/60 bg-emerald-300/5',
  },
};

const COLUMN_THEME: Record<BoardTaskStatus, { gradient: string; glow: string; chipBg: string; chipText: string }> = {
  todo: {
    gradient: 'from-amber-500/15 via-amber-300/5 to-transparent',
    glow: 'shadow-[0_25px_60px_rgba(251,191,36,0.15)]',
    chipBg: 'border border-amber-200/40 bg-amber-300/10',
    chipText: 'text-amber-50',
  },
  achieved: {
    gradient: 'from-emerald-400/20 via-sky-300/10 to-transparent',
    glow: 'shadow-[0_25px_60px_rgba(16,185,129,0.18)]',
    chipBg: 'border border-emerald-200/40 bg-emerald-300/10',
    chipText: 'text-emerald-50',
  },
};

const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

export default function TaskBoardModal({
  open,
  tasks,
  onClose,
  onStatusChange,
  onTaskUpdate,
  onAddTask,
  onApplyTimer,
  currentTaskId,
  onDeleteTask,
}: TaskBoardModalProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPriority, setDraftPriority] = useState<TaskPriority>('medium');
  const [draftDuration, setDraftDuration] = useState(25);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<BoardTaskStatus, boolean>>({
    todo: false,
    achieved: false,
  });
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});
  const [collapsedStats, setCollapsedStats] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    return COLUMN_CONFIG.reduce<Record<BoardTaskStatus, BoardTaskCard[]>>((acc, column) => {
      acc[column.key] = tasks.filter((task) => task.status === column.key);
      return acc;
    }, {
      todo: [],
      achieved: [],
    });
  }, [tasks]);

  // Calculate total duration for TO DO tasks
  const todoTotalDuration = useMemo(() => {
    return grouped.todo.reduce((total, task) => total + task.duration, 0);
  }, [grouped.todo]);

  const formatTotalDuration = (minutes: number) => {
    if (minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Calculate daily statistics for achieved tasks
  const dailyStats = useMemo(() => {
    const achievedTasks = grouped.achieved;
    const statsByDate: Record<string, {
      date: string;
      dayName: string;
      completedTasks: number;
      failedTasks: number; // Tasks that expired without completion
      totalTime: number; // Total Pomodoro minutes
      streak: number; // Consecutive days
    }> = {};

    achievedTasks.forEach(task => {
      // Assuming tasks have a completedAt timestamp, use current date as fallback
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      if (!statsByDate[date]) {
        statsByDate[date] = {
          date,
          dayName,
          completedTasks: 0,
          failedTasks: 0,
          totalTime: 0,
          streak: 1 // Simplified - would need proper streak calculation
        };
      }

      statsByDate[date].completedTasks += 1;
      statsByDate[date].totalTime += task.duration;
    });

    // Convert to array and sort by date (newest first)
    return Object.values(statsByDate).sort((a, b) => b.date.localeCompare(a.date));
  }, [grouped.achieved]);

  if (!open) return null;

  const handleAdd = () => {
    if (!draftTitle.trim()) return;
    onAddTask({
      title: draftTitle.trim(),
      priority: draftPriority,
      duration: draftDuration,
      status: 'todo',
    });
    setDraftTitle('');
    setDraftDuration(25);
    setDraftPriority('medium');
  };

  const handleDrop = (status: BoardTaskStatus) => {
    if (draggedTask) {
      onStatusChange(draggedTask, status);
      setDraggedTask(null);
    }
  };

  const renderTaskCard = (task: BoardTaskCard, columnKey: BoardTaskStatus) => {
    const priority = PRIORITY_META[task.priority];
    const isEditable = task.status === 'todo';
    const allowCollapse = columnKey !== 'achieved';
    const isCollapsed = collapsedTasks[task.id] ?? false;
    const isCurrent = currentTaskId === task.id && task.status !== 'achieved';
    const columnStyles = COLUMN_CARD_STYLES[columnKey];
    const columnTheme = COLUMN_THEME[columnKey];

    if (allowCollapse && isCollapsed) {
      return (
        <div
          key={`${task.id}-collapsed`}
          draggable
          onDragStart={() => setDraggedTask(task.id)}
          onDragEnd={() => setDraggedTask(null)}
          className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm text-white/80 transition ${
            isCurrent
              ? 'border-emerald-300/70 bg-emerald-400/10 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
              : `${columnStyles.collapsed} ${columnTheme.glow}`
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-base text-white">{task.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/60">
              <span className="inline-flex items-center gap-1 text-white/60">
                <Clock3 className="h-3.5 w-3.5" /> {task.duration}m
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: priority.pillBg, color: priority.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {priority.label}
              </span>
            </div>
          </div>
          <div className="ml-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsedTasks((prev) => ({ ...prev, [task.id]: false }))}
              className="rounded-full border border-white/15 p-2 text-white/70 transition hover:text-white"
              aria-label="Maximize task"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteTask(task.id)}
              className="rounded-full border border-red-400/30 p-2 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={task.id}
        draggable
        onDragStart={() => setDraggedTask(task.id)}
        onDragEnd={() => setDraggedTask(null)}
        className={`relative mx-auto w-full max-w-[420px] rounded-3xl border p-3 transition before:pointer-events-none before:absolute before:inset-0 before:rounded-[26px] before:bg-gradient-to-br ${COLUMN_THEME[columnKey].gradient} ${
          COLUMN_THEME[columnKey].glow
        } before:opacity-80 before:mix-blend-screen ${
          isCurrent
            ? 'border-emerald-300/80 bg-emerald-400/10 shadow-[0_15px_45px_rgba(16,185,129,0.35)]'
            : `${columnStyles.card} ${columnTheme.glow}`
        }`}
      >
        <div className="relative flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-heading text-base font-semibold text-white break-words leading-snug">{task.title}</p>
            <p className="text-[11px] text-white/50">{priority.label}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {allowCollapse && (
              <button
                type="button"
                onClick={() => setCollapsedTasks((prev) => ({ ...prev, [task.id]: true }))}
                className="rounded-full border border-white/15 p-2 text-white/70 transition hover:text-white"
                aria-label="Minimize task"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDeleteTask(task.id)}
              className="rounded-full border border-red-400/30 p-2 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <GripVertical className="h-4 w-4 text-white/30" />
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/70">
          <label className="inline-flex items-center gap-1.5">
            <span
              className="text-[9px] font-semibold uppercase tracking-wide text-white/45"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Timer
            </span>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/5 px-2 py-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
              <Clock3 className="h-3 w-3 text-white/60" />
              <input
                type="number"
                min={5}
                max={180}
                step={5}
                value={task.duration}
                onChange={(e) => onTaskUpdate(task.id, { duration: Number(e.target.value) })}
                className="w-12 bg-transparent text-center font-semibold text-white placeholder:text-white/40 focus:outline-none"
              />
              <span className="text-[10px] text-white/40">m</span>
            </div>
          </label>
          <label className="inline-flex items-center gap-1.5">
            <span
              className="text-[9px] font-semibold uppercase tracking-wide text-white/45"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Priority
            </span>
            <div className="relative">
              <select
                value={task.priority}
                onChange={(e) => onTaskUpdate(task.id, { priority: e.target.value as TaskPriority })}
                className="appearance-none rounded-full border border-white/15 px-3 pr-7 py-0.5 text-[11px] font-semibold text-white focus:border-[var(--accent-primary)] focus:outline-none"
                style={{ background: priority.pillBg }}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[var(--surface-base)] text-white">
                    {PRIORITY_META[option].label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1.5 h-3 w-3 text-white/70" />
            </div>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
          {isEditable && (
            <button
              type="button"
              onClick={() => {
                const nextTitle = window.prompt('Rename task', task.title);
                if (nextTitle && nextTitle.trim()) {
                  onTaskUpdate(task.id, { title: nextTitle.trim() });
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/70 transition hover:border-white/40"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
          {isEditable && onApplyTimer && (
            <button
              type="button"
              onClick={() => onApplyTimer(task)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white transition hover:bg-white/20"
            >
              <TimerReset className="h-3.5 w-3.5" />
              Set timer
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDailyStatsCard = (stats: typeof dailyStats[0], condensed = false) => {
    const isCollapsed = condensed ? true : (collapsedStats[stats.date] ?? false);
    const gradientLayer = condensed
      ? ''
      : `relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[22px] before:bg-gradient-to-br ${COLUMN_THEME.achieved.gradient} before:opacity-80 before:mix-blend-screen`;

    return (
      <div
        key={stats.date}
        className={`${gradientLayer} rounded-2xl border ${condensed ? 'p-3' : 'p-4'} ${COLUMN_CARD_STYLES.achieved.card} ${COLUMN_THEME.achieved.glow}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-white truncate">
                {stats.dayName}
              </h3>
              <span className="text-xs text-white/60 font-mono">
                {new Date(stats.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium">
              {stats.completedTasks} tasks completed
            </p>
          </div>
          <div className="flex items-center gap-2 text-emerald-300/80">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold">{stats.streak}</span>
            {!condensed && (
              <button
                type="button"
                onClick={() =>
                  setCollapsedStats((prev) => ({ ...prev, [stats.date]: !isCollapsed }))
                }
                className="rounded-full border border-white/15 p-1.5 text-white/70 transition hover:text-white"
                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} log`}
              >
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {isCollapsed ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-1 text-white/70">
              <Clock3 className="h-3.5 w-3.5" /> {stats.totalTime}m total
            </span>
            <span className="inline-flex items-center gap-1 text-red-200/80">
              <X className="h-3.5 w-3.5" /> {stats.failedTasks} failed
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-200/80">
              <Trophy className="h-3.5 w-3.5" /> {stats.streak} streak
            </span>
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-emerald-300/70" />
                <span className="text-white/80">{stats.totalTime}m total</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-red-300/70" />
                <span className="text-white/80">{stats.failedTasks} failed</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/60">
              <span>Avg: {stats.completedTasks > 0 ? Math.round(stats.totalTime / stats.completedTasks) : 0}m/task</span>
              <span className="font-mono">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 flex w-full max-w-6xl flex-col rounded-[34px] bg-gradient-to-r from-white/12 via-emerald-400/25 to-cyan-400/25 p-[1.5px] shadow-[0_45px_140px_rgba(2,6,23,0.85)] max-h-[90vh] overflow-hidden">
        <div className="relative flex h-full flex-col rounded-[32px] border border-white/10 bg-[var(--surface-muted)]/95 p-6">
          <div className="pointer-events-none absolute inset-0 rounded-[32px]">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/12 via-transparent to-white/6 opacity-40" />
            <div className="absolute inset-y-0 left-0 w-2/5 rounded-[32px] bg-gradient-to-r from-white/18 via-white/4 to-transparent opacity-40 blur-[55px]" />
            <div className="absolute inset-y-0 right-0 w-1/3 rounded-[32px] bg-gradient-to-l from-cyan-300/20 via-transparent to-transparent opacity-40 blur-[65px]" />
            <div className="absolute inset-0 rounded-[32px] border border-white/5 opacity-30" />
          </div>
          <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mission Board</p>
            <h2 className="font-heading text-3xl font-semibold text-white">Task control center</h2>
            <p className="text-sm text-white/60">Add tasks to your TO DO list and track your progress to completion.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/40"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </header>

        <div className="mb-6 grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="New task name"
            className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-primary)] focus:outline-none"
          />
          <select
            value={draftPriority}
            onChange={(e) => setDraftPriority(e.target.value as TaskPriority)}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.35)] focus:border-emerald-300 focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[#0c1222] text-white">
                {PRIORITY_META[option].label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
            <Clock3 className="h-4 w-4 text-white/60" />
            <input
              type="number"
              min={5}
              max={180}
              step={5}
              value={draftDuration}
              onChange={(e) => setDraftDuration(Number(e.target.value))}
              className="w-full bg-transparent text-white focus:outline-none"
            />
            <span className="text-white/50">min</span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex w-auto items-center gap-2 self-start justify-self-start rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-white/40 hover:bg-white/15"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#0b1220] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
              <Plus className="h-3 w-3" />
            </span>
            Add task
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid h-full min-h-0 gap-6 pr-2 overflow-y-auto md:grid-cols-[1.2fr_1fr]">
            {COLUMN_CONFIG.map((column) => (
              <div
                key={column.key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(column.key)}
                className={`mx-auto flex min-h-0 w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] border border-white/12 bg-white/5 p-4 shadow-[0_25px_50px_rgba(3,6,15,0.45)] backdrop-blur-xl transition ${
                  draggedTask ? 'ring-1 ring-white/20' : 'hover:border-white/20'
                }`}
              >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${column.badgeClass}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <column.icon className={`h-3.5 w-3.5 ${column.iconClass}`} />
                    {column.label}
                  </span>
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                    <span className={`inline-flex h-1 w-8 rounded-full ${column.accentBar}`} />
                    {column.subtitle}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <span className="text-sm font-semibold">{grouped[column.key].length}</span>
                  {column.key === 'todo' && (
                    <span className="text-xs text-amber-300/80 font-medium">
                      • {formatTotalDuration(todoTotalDuration)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedColumns((prev) => ({ ...prev, [column.key]: !prev[column.key] }))
                    }
                    className="rounded-full border border-white/10 p-1 text-white/60 transition hover:text-white"
                    aria-label={`${collapsedColumns[column.key] ? 'Expand' : 'Collapse'} ${column.label}`}
                  >
                    {collapsedColumns[column.key] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {collapsedColumns[column.key] ? (
                <div className="flex-1 space-y-2 overflow-y-auto pt-4 pr-1">
                  {column.key === 'achieved' ? (
                    dailyStats.length ? (
                      dailyStats.slice(0, 3).map((stats) => (
                        <div
                          key={stats.date}
                          className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm text-white/80 ${COLUMN_CARD_STYLES[column.key].collapsed}`}
                        >
                          <div className="flex flex-1 flex-col">
                            <p className="truncate font-medium text-white">{stats.dayName} - {stats.completedTasks} tasks</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                              <span className="inline-flex items-center gap-1 text-white/60">
                                <Clock3 className="h-3.5 w-3.5" /> {stats.totalTime}m
                              </span>
                              <span className="inline-flex items-center gap-1 text-emerald-300/60">
                                <Trophy className="h-3.5 w-3.5" /> {stats.streak}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/40">
                        No achievements yet
                      </p>
                    )
                  ) : grouped[column.key].length ? (
                    grouped[column.key].map((task: BoardTaskCard) => {
                      const priority = PRIORITY_META[task.priority];
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm text-white/80 ${COLUMN_CARD_STYLES[column.key].collapsed}`}
                        >
                          <div className="flex flex-1 flex-col">
                            <p className="truncate font-medium text-white">{task.title}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                              <span className="inline-flex items-center gap-1 text-white/60">
                                <Clock3 className="h-3.5 w-3.5" /> {task.duration}m
                              </span>
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                style={{ background: priority.pillBg, color: priority.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                              >
                                {priority.label}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedColumns((prev) => ({ ...prev, [column.key]: false }))
                              }
                              className="rounded-full border border-white/15 p-2 text-white/70 transition hover:text-white"
                              aria-label={`Expand ${column.label}`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              className="rounded-full border border-red-400/30 p-2 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
                              aria-label="Delete task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/40">
                      No tasks logged
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto pt-4 pr-1">
                  {column.key === 'achieved' ? (
                    dailyStats.length ? (
                      dailyStats.map((stats) => renderDailyStatsCard(stats))
                    ) : (
                      <p className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-white/40 ${COLUMN_CARD_STYLES[column.key].card}`}>
                        No achievements yet
                      </p>
                    )
                  ) : grouped[column.key].length ? (
                    grouped[column.key].map((task: BoardTaskCard) => renderTaskCard(task, column.key))
                  ) : (
                    <p className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-white/40 ${COLUMN_CARD_STYLES[column.key].card}`}>
                      Drop tasks here
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
};
