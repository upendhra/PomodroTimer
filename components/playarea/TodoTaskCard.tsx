'use client';

import { useState, useEffect } from 'react';
import { Pencil, TimerReset, Trash2, CheckCircle, GripVertical, Check, X } from 'lucide-react';
import { BoardTaskCard, PRIORITY_META, TaskPriority } from './types';

interface TodoTaskCardProps {
  task: BoardTaskCard;
  isCollapsed: boolean;
  isCurrent: boolean;
  onToggleCollapse: () => void;
  onUpdate: (updates: Partial<Omit<BoardTaskCard, 'id'>>) => void;
  onApplyTimer?: (task: BoardTaskCard) => void;
  onDelete: () => void;
  dragListeners?: any; // From @dnd-kit useSortable listeners
  showTimerEdit?: boolean; // Hide timer edit when using default duration mode
}

const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

export default function TodoTaskCard({
  task,
  isCollapsed,
  isCurrent,
  onToggleCollapse,
  onUpdate,
  onDelete,
  dragListeners,
  showTimerEdit = true,
}: TodoTaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editDuration, setEditDuration] = useState(task.duration);
  
  // Local state for inline editing (non-edit mode)
  const [localDuration, setLocalDuration] = useState(task.duration);
  const [localPriority, setLocalPriority] = useState<TaskPriority>(task.priority);
  const [localShortBreak, setLocalShortBreak] = useState(task.customShortBreak ?? 5);
  const [localLongBreak, setLocalLongBreak] = useState(task.customLongBreak ?? 10);

  // Sync local state when task changes externally
  useEffect(() => {
    setLocalDuration(task.duration);
    setLocalPriority(task.priority);
    setLocalShortBreak(task.customShortBreak ?? 5);
    setLocalLongBreak(task.customLongBreak ?? 10);
  }, [task.duration, task.priority, task.customShortBreak, task.customLongBreak]);

  const fieldBase = `task-${task.id}`;

  const priority = PRIORITY_META[task.priority];
  const isCompleted = !!task.completedAt;

  // Color logic: Yellow for backlog/not ready, Green for current focus task or completed
  const isReadyOrCurrent = isCurrent || isCompleted;
  const rowColorClass = isReadyOrCurrent
    ? 'border-emerald-200/70 bg-emerald-300/5'
    : 'border-amber-200/70 bg-amber-300/5';

  const handleSave = () => {
    const updates: Partial<Omit<BoardTaskCard, 'id'>> = {
      title: editTitle.trim(),
      priority: editPriority,
      duration: editDuration,
    };
    
    // Include break durations if task is in customised mode
    if (task.timerMode === 'customised') {
      updates.customShortBreak = localShortBreak;
      updates.customLongBreak = localLongBreak;
    }
    
    onUpdate(updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDuration(task.duration);
    setIsEditing(false);
  };

  const handleDone = () => {
    onUpdate({
      completedAt: new Date().toISOString(),
      sessionsCompleted: (task.sessionsCompleted || 0) + 1,
      actualDuration: task.duration,
    });
  };

  const handleUndo = () => {
    onUpdate({
      completedAt: null,
      sessionsCompleted: Math.max(0, (task.sessionsCompleted || 0) - 1),
      actualDuration: null,
    });
  };

  return (
    <div className={`rounded-xl border px-4 py-3 shadow-[0_4px_12px_rgba(2,4,12,0.3)] transition ${rowColorClass} hover:border-opacity-100`}>
      {/* Minimized Row View (Default - when isCollapsed = true) */}
      {isCollapsed && (
        <div className="flex items-center gap-3" onClick={showTimerEdit ? onToggleCollapse : undefined} style={{ cursor: showTimerEdit ? 'pointer' : 'default' }}>
          {/* Drag Handle */}
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing" {...dragListeners}>
            <GripVertical className="h-4 w-4 text-white/40" />
          </div>

          {/* Title or Edit Input */}
          {isEditing ? (
            <input
              type="text"
              id={`${fieldBase}-title`}
              name={`${fieldBase}-title`}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 min-w-0 rounded border border-white/10 bg-transparent px-2 py-1 text-sm text-white focus:border-[var(--accent-primary)] focus:outline-none"
              autoFocus
            />
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-white truncate">{task.title}</p>
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                )}
              </div>
            </div>
          )}

          {/* Priority or Edit Dropdown */}
          {isEditing ? (
            <select
              id={`${fieldBase}-priority`}
              name={`${fieldBase}-priority`}
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
              className="flex-shrink-0 rounded border border-white/10 bg-transparent px-2 py-1 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[var(--surface-base)] text-white">
                  {PRIORITY_META[option].label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex-shrink-0">
              <select
                id={`${fieldBase}-priority`}
                name={`${fieldBase}-priority`}
                value={localPriority}
                onChange={(e) => {
                  const newPriority = e.target.value as TaskPriority;
                  setLocalPriority(newPriority);
                  onUpdate({ priority: newPriority });
                }}
                disabled={isCompleted}
                className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[var(--surface-base)] text-white">
                    {PRIORITY_META[option].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timer or Edit Input - only show when showTimerEdit is true */}
          {showTimerEdit && (
            isEditing ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  id={`${fieldBase}-duration`}
                  name={`${fieldBase}-duration`}
                  min={1}
                  max={180}
                  step={1}
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-12 rounded border border-white/10 bg-transparent px-1 py-1 text-xs text-white text-center focus:border-[var(--accent-primary)] focus:outline-none"
                />
                <span className="text-xs text-white/60">m</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  id={`${fieldBase}-duration`}
                  name={`${fieldBase}-duration`}
                  min={1}
                  max={180}
                  step={1}
                  value={localDuration}
                  onChange={(e) => setLocalDuration(Number(e.target.value))}
                  onBlur={(e) => {
                    const newValue = Number(e.target.value);
                    const isValid = Number.isFinite(newValue) && newValue >= 1 && newValue <= 180;
                    console.log('⏱️ Timer onBlur (collapsed view):', {
                      taskId: task.id,
                      taskTitle: task.title,
                      currentDuration: task.duration,
                      inputValue: e.target.value,
                      newValue,
                      isValid,
                      willUpdate: isValid && newValue !== task.duration,
                    });
                    if (isValid && newValue !== task.duration) {
                      console.log('⏱️ Timer updating:', task.id, 'from', task.duration, 'to', newValue);
                      onUpdate({ duration: newValue });
                    } else {
                      console.log('⏱️ Timer not updating:', task.id, '- reverting to', task.duration);
                      setLocalDuration(task.duration);
                    }
                  }}
                  disabled={isCompleted}
                  className="w-12 rounded border border-white/10 bg-transparent px-1 py-1 text-xs text-white text-center focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-white/60">m</span>
              </div>
            )
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center justify-center rounded border border-green-400/30 p-1 text-green-200 transition hover:border-green-400/70 hover:text-green-100"
                  aria-label="Save changes"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center rounded border border-red-400/30 p-1 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
                  aria-label="Cancel changes"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                {!isCompleted ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDone(); }}
                    className="inline-flex items-center gap-1 rounded border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/20"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                    className="inline-flex items-center gap-1 rounded border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-400/20"
                  >
                    <X className="h-3 w-3" />
                    Undo
                  </button>
                )}
                {!isCompleted && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    className="inline-flex items-center justify-center rounded border border-white/15 p-1 text-white/70 transition hover:text-white"
                    aria-label="Edit task"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="inline-flex items-center justify-center rounded border border-red-400/30 p-1 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Expanded View (when isCollapsed = false) */}
      {!isCollapsed && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div className="flex-shrink-0 cursor-grab active:cursor-grabbing" {...dragListeners}>
              <GripVertical className="h-4 w-4 text-white/40" />
            </div>

            {/* Title or Edit Input */}
            {isEditing ? (
              <input
                type="text"
                id={`${fieldBase}-title`}
                name={`${fieldBase}-title`}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 min-w-0 rounded border border-white/10 bg-transparent px-2 py-1 text-sm text-white focus:border-[var(--accent-primary)] focus:outline-none"
                autoFocus
              />
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white truncate">{task.title}</p>
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* Compact Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                    className="inline-flex items-center justify-center rounded border border-green-400/30 p-1 text-green-200 transition hover:border-green-400/70 hover:text-green-100"
                    aria-label="Save changes"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                    className="inline-flex items-center justify-center rounded border border-red-400/30 p-1 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
                    aria-label="Cancel changes"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                      className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs text-white/70 transition hover:border-white/40"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  )}
                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDone(); }}
                      className="inline-flex items-center gap-1 rounded border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/20"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                      className="inline-flex items-center gap-1 rounded border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-400/20"
                    >
                      <X className="h-3 w-3" />
                      Undo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center justify-center rounded border border-red-400/30 p-1 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Expanded Edit Fields */}
          {!isEditing && (
            <div className="flex items-center gap-3 ml-7 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Priority:</span>
                <select
                  id={`${fieldBase}-priority-expanded`}
                  name={`${fieldBase}-priority-expanded`}
                  value={localPriority}
                  onChange={(e) => {
                    const newPriority = e.target.value as TaskPriority;
                    setLocalPriority(newPriority);
                    onUpdate({ priority: newPriority });
                  }}
                  disabled={isCompleted}
                  className="rounded border border-white/10 bg-transparent px-2 py-1 text-xs text-white focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-[var(--surface-base)] text-white">
                      {PRIORITY_META[option].label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Timer:</span>
                <input
                  type="number"
                  id={`${fieldBase}-duration-expanded`}
                  name={`${fieldBase}-duration-expanded`}
                  min={1}
                  max={180}
                  step={1}
                  value={localDuration}
                  onChange={(e) => setLocalDuration(Number(e.target.value))}
                  onBlur={(e) => {
                    const newValue = Number(e.target.value);
                    const isValid = Number.isFinite(newValue) && newValue >= 1 && newValue <= 180;
                    console.log('⏱️ Timer onBlur (expanded view):', {
                      taskId: task.id,
                      taskTitle: task.title,
                      currentDuration: task.duration,
                      inputValue: e.target.value,
                      newValue,
                      isValid,
                      willUpdate: isValid && newValue !== task.duration,
                    });
                    if (isValid && newValue !== task.duration) {
                      console.log('⏱️ Timer updating:', task.id, 'from', task.duration, 'to', newValue);
                      onUpdate({ duration: newValue });
                    } else {
                      console.log('⏱️ Timer not updating:', task.id, '- reverting to', task.duration);
                      setLocalDuration(task.duration);
                    }
                  }}
                  disabled={isCompleted}
                  className="w-12 rounded border border-white/10 bg-transparent px-1 py-1 text-xs text-white text-center focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-white/60">min</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Short Break:</span>
                <input
                  type="number"
                  id={`${fieldBase}-short-break-expanded`}
                  name={`${fieldBase}-short-break-expanded`}
                  min={1}
                  max={30}
                  step={1}
                  value={localShortBreak}
                  onChange={(e) => setLocalShortBreak(Number(e.target.value))}
                  onBlur={(e) => {
                    const newValue = Number(e.target.value);
                    const isValid = Number.isFinite(newValue) && newValue >= 1 && newValue <= 30;
                    if (isValid && newValue !== task.customShortBreak) {
                      onUpdate({ customShortBreak: newValue });
                    } else {
                      setLocalShortBreak(task.customShortBreak ?? 5);
                    }
                  }}
                  disabled={isCompleted}
                  className="w-12 rounded border border-white/10 bg-transparent px-1 py-1 text-xs text-white text-center focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-white/60">min</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Long Break:</span>
                <input
                  type="number"
                  id={`${fieldBase}-long-break-expanded`}
                  name={`${fieldBase}-long-break-expanded`}
                  min={1}
                  max={60}
                  step={1}
                  value={localLongBreak}
                  onChange={(e) => setLocalLongBreak(Number(e.target.value))}
                  onBlur={(e) => {
                    const newValue = Number(e.target.value);
                    const isValid = Number.isFinite(newValue) && newValue >= 1 && newValue <= 60;
                    if (isValid && newValue !== task.customLongBreak) {
                      onUpdate({ customLongBreak: newValue });
                    } else {
                      setLocalLongBreak(task.customLongBreak ?? 10);
                    }
                  }}
                  disabled={isCompleted}
                  className="w-12 rounded border border-white/10 bg-transparent px-1 py-1 text-xs text-white text-center focus:border-[var(--accent-primary)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-white/60">min</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
