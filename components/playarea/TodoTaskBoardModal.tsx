'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
  CheckCircle,
  TimerReset,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BoardTaskCard, PRIORITY_META, TaskPriority } from '@/components/playarea/types';
import { TaskBucketService, TaskLimitValidation } from '@/services/taskBucketService';
import TodoTaskCard from './TodoTaskCard';

const REORDER_DEBOUNCE_MS = 400;
const REORDER_RETRY_DELAY_MS = 1000;
const MAX_REORDER_ATTEMPTS = 3;

type ReorderPayload = {
  taskOrders: { id: string; sortOrder: number }[];
  fallback: BoardTaskCard[];
  attempt: number;
};

interface TodoTaskBoardModalProps {
  open: boolean;
  tasks: BoardTaskCard[];
  onClose: () => void;
  onStatusChange: (taskId: string, status: 'todo' | 'achieved') => void;
  onTaskUpdate: (taskId: string, updates: Partial<Omit<BoardTaskCard, 'id'>>) => void;
  onAddTask: (task: Omit<BoardTaskCard, 'id'>) => void;
  onApplyTimer?: (task: BoardTaskCard) => void;
  currentTaskId?: string | null;
  onDeleteTask: (taskId: string) => void;
  projectId?: string;
  onTasksCleared?: () => void;
  onTasksLoaded?: (tasks: BoardTaskCard[]) => void;
  onRefresh?: () => void;
  showTimerEdit?: boolean; // Hide timer edit when using default duration mode
}

const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

export default function TodoTaskBoardModal({
  open,
  tasks,
  onClose,
  onStatusChange,
  onTaskUpdate,
  onAddTask,
  onApplyTimer,
  currentTaskId,
  onDeleteTask,
  projectId,
  onTasksCleared,
  onTasksLoaded,
  onRefresh,
  showTimerEdit = true,
}: TodoTaskBoardModalProps) {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPriority, setDraftPriority] = useState<TaskPriority>('medium');
  const [draftDuration, setDraftDuration] = useState(25);
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});
  const [taskLimitValidation, setTaskLimitValidation] = useState<TaskLimitValidation | null>(null);
  const [modalTasks, setModalTasks] = useState<BoardTaskCard[]>([]);
  const [tasksAddedDuringSession, setTasksAddedDuringSession] = useState<Set<string>>(new Set());
  const [tasksModifiedDuringSession, setTasksModifiedDuringSession] = useState<Set<string>>(new Set());
  const [tasksReorderedDuringSession, setTasksReorderedDuringSession] = useState<Set<string>>(new Set());
  const reorderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reorderRequestController = useRef<AbortController | null>(null);
  const latestReorderPayloadRef = useRef<ReorderPayload | null>(null);

  const hasFetched = useRef(false);

  // Sync modal tasks with external tasks when modal opens
  useEffect(() => {
    if (open && !hasFetched.current && projectId) {
      hasFetched.current = true;

      if (tasks.length > 0) {
        // Filter to todo tasks for this modal
        const todoTasksFromProps = tasks.filter((task) => task.status === 'todo');
        
        // Sort by sortOrder ascending
        const sorted = [...todoTasksFromProps].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        
        // Check if sortOrder is sequential (0, 1, 2, ...)
        const isSequential = sorted.every((task, index) => task.sortOrder === index);
        
        const finalTasks = !isSequential ? sorted.map((task, index) => ({ ...task, sortOrder: index })) : sorted;
        
        // Set modal tasks (todo tasks only, since this modal only handles todo)
        setModalTasks(finalTasks);
      } else {
        // Fetch tasks if none provided
        const fetchTasks = async () => {
          try {
            const response = await fetch(`/api/tasks?projectId=${projectId}`);
            if (response.ok) {
              const data = await response.json();
              const allTasks = data.tasks || [];
              const todoTasks = allTasks.filter((task: BoardTaskCard) => task.status === 'todo');
              // Sort by sortOrder
              const sorted = [...todoTasks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
              setModalTasks(sorted);
              onTasksLoaded?.(allTasks);
            } else {
              console.warn('Failed to load tasks from API in modal');
              setModalTasks([]);
              onTasksLoaded?.([]);
            }
          } catch (error) {
            console.warn('Error loading tasks in modal:', error);
            setModalTasks([]);
            onTasksLoaded?.([]);
          }
        };
        
        fetchTasks();
      }
    }
  }, [open, projectId]);

  const todoTasks = useMemo(() => {
    return modalTasks.filter((task) => task.status === 'todo');
  }, [modalTasks]);

  const handleModalAddTask = async (task: Omit<BoardTaskCard, 'id' | 'createdAt' | 'completedAt' | 'sessionsCompleted' | 'actualDuration' | 'sortOrder'>) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: BoardTaskCard = {
      id: tempId,
      title: task.title,
      priority: task.priority,
      duration: task.duration,
      status: task.status,
      sortOrder: modalTasks.length,
      targetSessions: task.targetSessions,
      dailyGoal: task.dailyGoal,
      createdAt: new Date().toISOString(),
    };

    // Add immediately to UI
    setModalTasks(prev => [...prev, optimisticTask]);

    try {
      console.log('🔐 Creating task - checking authentication...');
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
          title: task.title,
          priority: task.priority,
          duration: task.duration,
          status: task.status,
          projectId: projectId,
          targetSessions: task.targetSessions,
          dailyGoal: task.dailyGoal,
          sortOrder: modalTasks.length,
        }),
      });

      if (response.status === 201) {
        const createdTask = await response.json();
        console.log('✅ Task created in modal:', createdTask.id);
        // Replace temp task with real one
        setModalTasks(prev => prev.map(t => t.id === tempId ? createdTask : t));
        setTasksAddedDuringSession(prev => new Set(prev).add(createdTask.id));
      } else if (response.status === 401) {
        console.error('❌ Authentication required - please log in again');
        alert('Your session has expired. Please refresh the page and log in again.');
        throw new Error('Authentication required');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to create task in modal:', errorData);
        throw new Error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('❌ Error creating task in modal:', error);
      // Remove optimistic task on failure
      setModalTasks(prev => prev.filter(t => t.id !== tempId));
      throw error;
    }
  };

  const handleModalTaskUpdate = async (taskId: string, updates: Partial<Omit<BoardTaskCard, 'id'>>) => {
    console.log('📝 handleModalTaskUpdate called:', { taskId, updates });
    try {
      console.log('📝 Calling onTaskUpdate (handleBoardTaskUpdate)...');
      await onTaskUpdate(taskId, updates);
      console.log('📝 onTaskUpdate completed, updating modalTasks...');
      setModalTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));
      setTasksModifiedDuringSession(prev => new Set(prev).add(taskId));
      console.log('✅ Task updated in modal');
      // Removed onRefresh() to prevent race condition - parent component updates boardTasks directly
    } catch (error) {
      console.error('❌ Failed to update task in modal:', taskId, error);
    }
  };

  const handleModalDeleteTask = async (taskId: string) => {
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
        console.log('✅ Task deleted from modal successfully');
        setModalTasks(prev => prev.filter(task => task.id !== taskId));
      } else if (response.status === 404) {
        console.error('❌ Task not found');
        setModalTasks(prev => prev.filter(task => task.id !== taskId));
      } else {
        const errorData = await response.json();
        console.error('❌ Delete failed in modal:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to delete task');
      }
      onRefresh?.();
    } catch (error) {
      console.error('❌ Error deleting task from modal:', error);
      throw error;
    }
  };

  const handleClose = async () => {
    onRefresh?.();
    onClose();
  };

  const persistReorder = useCallback(async () => {
    if (!projectId || !latestReorderPayloadRef.current) {
      return;
    }

    const payload = latestReorderPayloadRef.current;
    latestReorderPayloadRef.current = null;

    const controller = new AbortController();
    reorderRequestController.current = controller;

    const queueRetry = (message: string) => {
      if (payload.attempt >= MAX_REORDER_ATTEMPTS) {
        setModalTasks(payload.fallback);
        alert(message);
        return;
      }

      latestReorderPayloadRef.current = {
        ...payload,
        attempt: payload.attempt + 1,
      };

      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }

      reorderTimeoutRef.current = setTimeout(() => {
        reorderTimeoutRef.current = null;
        void persistReorder();
      }, REORDER_RETRY_DELAY_MS);
    };

    try {
      const response = await fetch('/api/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          taskOrders: payload.taskOrders,
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        console.log('Reorder persisted successfully');
        onRefresh?.();
      } else {
        console.error('Failed to persist reorder');
        queueRetry('Failed to save the new order. Please try again.');
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Error persisting reorder:', error);
      queueRetry('Error saving the new order. Please try again.');
      return;
    } finally {
      reorderRequestController.current = null;
    }
  }, [onRefresh, projectId]);

  const schedulePersistReorder = useCallback((updatedTasks: BoardTaskCard[], fallback: BoardTaskCard[]) => {
    latestReorderPayloadRef.current = {
      taskOrders: updatedTasks.map(task => ({
        id: task.id,
        sortOrder: task.sortOrder ?? 0,
      })),
      fallback,
      attempt: 0,
    };

    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
    }

    if (reorderRequestController.current) {
      reorderRequestController.current.abort();
      reorderRequestController.current = null;
    }

    reorderTimeoutRef.current = setTimeout(() => {
      reorderTimeoutRef.current = null;
      void persistReorder();
    }, REORDER_DEBOUNCE_MS);
  }, [persistReorder]);

  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
      if (reorderRequestController.current) {
        reorderRequestController.current.abort();
      }
    };
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = todoTasks.findIndex(task => task.id === active.id);
    const newIndex = todoTasks.findIndex(task => task.id === over.id);

    const oldOrder = [...todoTasks]; // Store old order for revert

    const newOrder = arrayMove(todoTasks, oldIndex, newIndex);

    // Update modal tasks with new order and sequential sortOrder
    const updatedTasks = newOrder.map((task, index) => ({
      ...task,
      sortOrder: index,
    }));

    setModalTasks(updatedTasks); // Optimistic update

    // Send API call
    if (!projectId) {
      console.warn('No project ID available, skipping reorder persistence');
      return;
    }

    schedulePersistReorder(updatedTasks, oldOrder);
  };

  const handleAdd = async () => {
    if (!draftTitle.trim()) return;
    if (!projectId) return;

    try {
      const validation = await TaskBucketService.validateTaskCreation(projectId, modalTasks.length);

      if (!validation.isValid) {
        setTaskLimitValidation(validation);
        return;
      }

      setTaskLimitValidation(null);

      await handleModalAddTask({
        title: draftTitle.trim(),
        priority: draftPriority,
        duration: draftDuration,
        status: 'todo',
      });

      setDraftTitle('');
      setDraftDuration(25);
      setDraftPriority('medium');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTaskLimitValidation({
        isValid: false,
        message: `Unable to add task: ${errorMessage}`,
        type: 'error'
      });
    }
  };

  const handleClearCompleted = async () => {
    if (!projectId) return;

    try {
      const completedTaskIds = modalTasks
        .filter(task => task.status === 'todo' && task.completedAt)
        .map(task => task.id);

      if (completedTaskIds.length > 0) {
        completedTaskIds.forEach(taskId => {
          onDeleteTask(taskId);
        });

        setTaskLimitValidation({
          isValid: true,
          message: `🏆 Victory unlocked! ${completedTaskIds.length} task${completedTaskIds.length > 1 ? 's' : ''} cleared. Champion performance continues!`,
          type: 'success'
        });

        setTimeout(() => {
          setTaskLimitValidation(null);
        }, 3000);
        onRefresh?.();
        return;
      }

      const result = await TaskBucketService.clearCompletedTasks(projectId);

      if (result.clearedCount > 0) {
        onTasksCleared?.();

        setTaskLimitValidation({
          isValid: true,
          message: `🏆 Victory unlocked! ${result.clearedCount} task${result.clearedCount > 1 ? 's' : ''} cleared. Champion performance continues!`,
          type: 'success'
        });

        setTimeout(() => {
          setTaskLimitValidation(null);
        }, 3000);
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to clear completed tasks:', error);
      setTaskLimitValidation({
        isValid: false,
        message: 'Failed to clear completed tasks. Please try again.',
        type: 'error'
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {taskLimitValidation && (
        <div className="fixed left-1/2 top-6 z-[1000] w-[min(960px,calc(100%-2rem))] -translate-x-1/2 pointer-events-none">
          <div className={`pointer-events-auto rounded-2xl border p-4 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-md ${
            taskLimitValidation.type === 'success'
              ? 'border-emerald-300/40 bg-emerald-950/80'
              : taskLimitValidation.type === 'warning'
              ? 'border-amber-300/50 bg-amber-950/80'
              : 'border-red-300/40 bg-red-950/80'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className={`text-sm font-semibold ${
                  taskLimitValidation.type === 'success' ? 'text-emerald-100' :
                  taskLimitValidation.type === 'warning' ? 'text-amber-100' : 'text-red-100'
                }`}>
                  {taskLimitValidation.message}
                </p>
                {taskLimitValidation.type === 'warning' && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Completed Tasks
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTaskLimitValidation(null)}
                className="rounded-full border border-white/20 p-1 text-white/80 transition hover:text-white"
                aria-label="Dismiss message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex w-full max-w-5xl flex-col rounded-[var(--card-radius-lg)] border border-white/10 bg-[var(--surface-muted)]/95 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] max-h-[94vh] overflow-hidden">
        {/* Header */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Mission control</p>
            <h2 className="font-heading text-4xl font-semibold text-white">Task control center</h2>
            <p className="text-sm text-white/60">Organize your missions and stay focused on what matters.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/40"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </header>

        {/* Add Task Form */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Add new mission</h3>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              type="text"
              id="new-task-title"
              name="new-task-title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="rounded-xl border border-white/10 bg-transparent px-4 py-2 text-white placeholder:text-white/40 focus:border-[var(--accent-primary)] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <select
              id="new-task-priority"
              name="new-task-priority"
              value={draftPriority}
              onChange={(e) => setDraftPriority(e.target.value as TaskPriority)}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.35)] focus:border-emerald-300 focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#0c1222] text-white">
                  {PRIORITY_META[option].label}
                </option>
              ))}
            </select>
            {showTimerEdit && (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-2">
                <Clock3 className="h-4 w-4 text-white/60" />
                <input
                  type="number"
                  id="new-task-duration"
                  name="new-task-duration"
                  min={5}
                  max={180}
                  step={5}
                  value={draftDuration}
                  onChange={(e) => setDraftDuration(Number(e.target.value))}
                  className="w-16 bg-transparent text-white focus:outline-none"
                />
                <span className="text-white/50">min</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex w-auto items-center gap-2 justify-self-start rounded-full border border-white/15 bg-white/10 px-6 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-white/40 hover:bg-white/15"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#0b1220] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
                <Plus className="h-3 w-3" />
              </span>
              Add task
            </button>
          </div>
        </div>

        {/* TO DO Section */}
        <div className="flex-1 min-h-0">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-white">TO DO</h3>
            <span className="rounded-full border border-amber-300/70 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-amber-50 shadow-[0_0_25px_rgba(251,191,36,0.25)]">
              {todoTasks.length} tasks
            </span>
          </div>

          <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            {todoTasks.length ? (
              <div className="space-y-1">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={todoTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {todoTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        isCollapsed={collapsedTasks[task.id] ?? !showTimerEdit}
                        isCurrent={currentTaskId === task.id}
                        onToggleCollapse={() => setCollapsedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                        onUpdate={(updates: Partial<Omit<BoardTaskCard, 'id'>>) => handleModalTaskUpdate(task.id, updates).catch(console.error)}
                        onApplyTimer={onApplyTimer}
                        onDelete={() => handleModalDeleteTask(task.id).catch(console.error)}
                        showTimerEdit={showTimerEdit}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5">
                <div className="text-center">
                  <Target className="mx-auto h-12 w-12 text-white/30 mb-4" />
                  <h4 className="text-lg font-semibold text-white/60 mb-2">No missions yet</h4>
                  <p className="text-sm text-white/40">Add your first task above to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// SortableTaskCard component
const SortableTaskCard = ({ task, isCollapsed, isCurrent, onToggleCollapse, onUpdate, onApplyTimer, onDelete, showTimerEdit }: {
  task: BoardTaskCard;
  isCollapsed: boolean;
  isCurrent: boolean;
  onToggleCollapse: () => void;
  onUpdate: (updates: Partial<Omit<BoardTaskCard, 'id'>>) => void;
  onApplyTimer?: (task: BoardTaskCard) => void;
  onDelete: () => void;
  showTimerEdit?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="cursor-grab active:cursor-grabbing">
      <TodoTaskCard
        task={task}
        isCollapsed={isCollapsed}
        isCurrent={isCurrent}
        onToggleCollapse={onToggleCollapse}
        onUpdate={onUpdate}
        onApplyTimer={onApplyTimer}
        onDelete={onDelete}
        dragListeners={listeners}
        showTimerEdit={showTimerEdit}
      />
    </div>
  );
};
