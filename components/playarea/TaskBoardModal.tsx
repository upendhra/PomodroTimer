'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock3, GripVertical, Pencil, Plus, TimerReset, X } from 'lucide-react';
import { BoardTaskCard, BoardTaskStatus, PRIORITY_META, TaskPriority } from './types';

interface TaskBoardModalProps {
  open: boolean;
  tasks: BoardTaskCard[];
  onClose: () => void;
  onStatusChange: (taskId: string, status: BoardTaskStatus) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Omit<BoardTaskCard, 'id'>>) => void;
  onAddTask: (task: Omit<BoardTaskCard, 'id'>) => void;
  onApplyTimer?: (task: BoardTaskCard) => void;
}

const COLUMN_CONFIG: { key: BoardTaskStatus; label: string; subtitle: string }[] = [
  { key: 'todo', label: 'To do', subtitle: 'Backlog ideas' },
  { key: 'planned', label: 'Planned today', subtitle: 'On deck next' },
  { key: 'achieved', label: 'Achieved tasks', subtitle: 'Wins & ship logs' },
];

const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

export default function TaskBoardModal({
  open,
  tasks,
  onClose,
  onStatusChange,
  onTaskUpdate,
  onAddTask,
  onApplyTimer,
}: TaskBoardModalProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPriority, setDraftPriority] = useState<TaskPriority>('medium');
  const [draftDuration, setDraftDuration] = useState(25);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<BoardTaskStatus, boolean>>({
    todo: false,
    planned: false,
    achieved: false,
  });
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    return COLUMN_CONFIG.reduce<Record<BoardTaskStatus, BoardTaskCard[]>>((acc, column) => {
      acc[column.key] = tasks.filter((task) => task.status === column.key);
      return acc;
    }, {
      todo: [],
      planned: [],
      achieved: [],
    });
  }, [tasks]);

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

    if (allowCollapse && isCollapsed) {
      return (
        <div
          key={`${task.id}-collapsed`}
          draggable
          onDragStart={() => setDraggedTask(task.id)}
          onDragEnd={() => setDraggedTask(null)}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-base text-white">{task.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/60">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" /> {task.duration}m
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.2em]"
                style={{ background: priority.pillBg, color: priority.color }}
              >
                {priority.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsedTasks((prev) => ({ ...prev, [task.id]: false }))}
            className="ml-3 rounded-full border border-white/15 p-2 text-white/70 transition hover:text-white"
            aria-label="Maximize task"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div
        key={task.id}
        draggable
        onDragStart={() => setDraggedTask(task.id)}
        onDragEnd={() => setDraggedTask(null)}
        className="rounded-2xl border border-white/10 bg-[var(--surface-base)]/70 p-4 shadow-[0_15px_40px_rgba(2,4,12,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-semibold text-white break-words leading-tight">{task.title}</p>
            <p className="text-xs text-white/50">{priority.label}</p>
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
            <GripVertical className="h-4 w-4 text-white/30" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/70">
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-white/40">
              <Clock3 className="h-3.5 w-3.5" /> Timer
            </span>
            <input
              type="number"
              min={5}
              max={180}
              step={5}
              value={task.duration}
              onChange={(e) => onTaskUpdate(task.id, { duration: Number(e.target.value) })}
              className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-white/40">Priority</span>
            <select
              value={task.priority}
              onChange={(e) => onTaskUpdate(task.id, { priority: e.target.value as TaskPriority })}
              className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white focus:border-[var(--accent-primary)] focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[var(--surface-base)] text-white">
                  {PRIORITY_META[option].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isEditable && (
            <button
              type="button"
              onClick={() => {
                const nextTitle = window.prompt('Rename task', task.title);
                if (nextTitle && nextTitle.trim()) {
                  onTaskUpdate(task.id, { title: nextTitle.trim() });
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:border-white/40"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {isEditable && onApplyTimer && (
            <button
              type="button"
              onClick={() => onApplyTimer(task)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <TimerReset className="h-3.5 w-3.5" />
              Set timer
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 flex w-full max-w-6xl flex-col rounded-[var(--card-radius-lg)] border border-white/10 bg-[var(--surface-muted)]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.65)] max-h-[90vh] overflow-hidden">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Mission board</p>
            <h2 className="font-heading text-3xl font-semibold text-white">Task control center</h2>
            <p className="text-sm text-white/60">Drag cards to plan your day and ship what matters.</p>
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

        <div className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
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
            className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white focus:border-[var(--accent-primary)] focus:outline-none"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-[var(--surface-base)] text-white">
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
            className="flex items-center justify-center rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-[#0b1220] transition hover:brightness-105"
          >
            <Plus className="mr-2 h-4 w-4" /> Add task
          </button>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto pr-2 md:grid-cols-3">
          {COLUMN_CONFIG.map((column) => (
            <div
              key={column.key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(column.key)}
              className={`rounded-[24px] border border-white/10 bg-white/5 p-4 transition ${
                draggedTask ? 'ring-1 ring-white/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">{column.label}</p>
                  <p className="text-sm text-white/60">{column.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/50">{grouped[column.key].length}</span>
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
                <div className="mt-4 space-y-2">
                  {grouped[column.key].length ? (
                    grouped[column.key].map((task) => {
                      const priority = PRIORITY_META[task.priority];
                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                        >
                          <div className="flex flex-1 flex-col">
                            <p className="truncate font-medium text-white">{task.title}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                              <span className="inline-flex items-center gap-1 text-white/60">
                                <Clock3 className="h-3.5 w-3.5" /> {task.duration}m
                              </span>
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.15em]"
                                style={{ background: priority.pillBg, color: priority.color }}
                              >
                                {priority.label}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedColumns((prev) => ({ ...prev, [column.key]: false }))
                            }
                            className="ml-3 rounded-full border border-white/15 p-2 text-white/70 transition hover:text-white"
                            aria-label={`Expand ${column.label}`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
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
                <div className="mt-4 space-y-4">
                  {grouped[column.key].length ? (
                    grouped[column.key].map((task) => renderTaskCard(task, column.key))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/40">
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
  );
}
