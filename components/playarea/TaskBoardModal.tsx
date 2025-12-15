'use client';

import { useEffect, useMemo, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardList,
  Flame,
  Pencil,
  Plus,
  Target,
  TimerReset,
  Trash2,
  Trophy,
  X,
  Zap,
  CheckCircle,
  Calendar,
  CalendarDays,
  TrendingUp,
  ListChecks,
  Clock,
  Focus,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BoardTaskCard, BoardTaskStatus, PRIORITY_META, TaskPriority, DailyStats } from './types';
import { TaskBucketService, TaskLimitValidation } from '@/services/taskBucketService';

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
  dailyStats?: DailyStats;
  projectId?: string;
  onTasksCleared?: () => void;
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
    subtitle: 'Your task backlog',
    icon: ClipboardList,
    badgeClass: 'border-amber-300/70 bg-amber-400/10 text-amber-50 shadow-[0_0_25px_rgba(251,191,36,0.25)]',
    iconClass: 'text-amber-200',
    accentBar: 'bg-amber-400/60',
    accentBorder: 'border-l-4 border-l-amber-300/80',
  },
  {
    key: 'achieved',
    label: 'Achieved Today',
    subtitle: 'Stats & insights',
    icon: Trophy,
    badgeClass: 'border-emerald-300/70 bg-emerald-400/10 text-emerald-50 shadow-[0_0_25px_rgba(16,185,129,0.3)]',
    iconClass: 'text-emerald-200',
    accentBar: 'bg-emerald-300/80',
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
  dailyStats,
  projectId,
  onTasksCleared,
}: TaskBoardModalProps) {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPriority, setDraftPriority] = useState<TaskPriority>('medium');
  const [draftDuration, setDraftDuration] = useState(25);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<'todo', boolean>>({
    todo: false,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});
  const [taskLimitValidation, setTaskLimitValidation] = useState<TaskLimitValidation | null>(null);
  const [originalTasks, setOriginalTasks] = useState<BoardTaskCard[]>([]);
  const [modalTasks, setModalTasks] = useState<BoardTaskCard[]>([]); // Internal modal task state
  const [tasksAddedDuringSession, setTasksAddedDuringSession] = useState<Set<string>>(new Set()); // Track tasks added this session
  const [tasksModifiedDuringSession, setTasksModifiedDuringSession] = useState<Set<string>>(new Set()); // Track tasks modified this session
  const [tasksReorderedDuringSession, setTasksReorderedDuringSession] = useState<Set<string>>(new Set()); // Track tasks reordered this session
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Sync modal tasks with external tasks when modal opens
  useEffect(() => {
    if (open && tasks.length > 0 && modalTasks.length === 0) {
      const fixTodoAndSet = async () => {
        // Get todo tasks and sort by sortOrder
        const todoTasks = tasks.filter(t => t.status === 'todo').sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        
        // Check if sortOrder is sequential for todo tasks
        const isSequential = todoTasks.every((task, index) => task.sortOrder === index);
        
        let fixedTasks = tasks;
        if (!isSequential) {
          // Fix sort_order to be sequential 0, 1, 2, ... for todo tasks
          const correctedTodo = todoTasks.map((task, index) => ({ ...task, sortOrder: index }));
          
          // Replace todo tasks in the full tasks array
          fixedTasks = tasks.map(t => t.status === 'todo' ? correctedTodo.find(ct => ct.id === t.id) || t : t);
          
          // Send PATCH to update DB silently for todo tasks
          if (projectId) {
            try {
              const response = await fetch('/api/tasks/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId,
                  taskOrders: correctedTodo.map(t => ({ id: t.id, sortOrder: t.sortOrder })),
                }),
              });
              if (response.ok) {
                console.log('✅ Todo sort order fixed in database (silent one-time fix)');
              } else {
                console.error('❌ Failed to fix todo sort order in database');
              }
            } catch (error) {
              console.error('❌ Error fixing todo sort order:', error);
            }
          }
        }
        
        // Set modal and original tasks
        const deepCopy = JSON.parse(JSON.stringify(fixedTasks));
        setModalTasks(deepCopy);
        setOriginalTasks(deepCopy);
      };
      
      fixTodoAndSet();
    }
  }, [open, tasks, modalTasks.length, projectId]);

  // Provide default dailyStats if not available
  const effectiveDailyStats: DailyStats = dailyStats || {
    date: new Date().toISOString().split('T')[0],
    tasksCompleted: 0,
    sessionsCompleted: 0,
    hoursWorked: 0,
    targetTasks: 5,
    targetSessions: 8,
    targetHours: 4,
    achieved: false,
    focusedAlerts: 8,  // Default: 8 focused responses for demo
    deviatedAlerts: 3, // Default: 3 deviated responses for demo
  };

  const grouped = useMemo(() => {
    return COLUMN_CONFIG.reduce<Record<BoardTaskStatus, BoardTaskCard[]>>((acc, column) => {
      acc[column.key] = modalTasks.filter((task) => task.status === column.key);
      return acc;
    }, {
      todo: [],
      achieved: [],
    });
  }, [modalTasks]);

  const comprehensiveStats = useMemo(() => {
    // Filter achieved tasks for selected date
    const achievedOnDate = grouped.achieved.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt).toDateString();
      const targetDate = selectedDate.toDateString();
      return completedDate === targetDate;
    });

    // Calculate total planned hours from all TODO tasks
    const totalPlannedHours = grouped.todo.reduce((sum, task) => sum + task.duration, 0) / 60;
    
    // Calculate completed hours for selected date
    const completedHours = achievedOnDate.reduce((sum, task) => sum + (task.actualDuration || task.duration), 0) / 60;
    
    // Calculate total sessions for selected date
    const totalSessions = achievedOnDate.reduce((sum, task) => sum + (task.sessionsCompleted || 0), 0);
    
    // Calculate completed count
    const completedCount = achievedOnDate.length;
    
    // Planned vs Completed percentage
    const plannedVsCompleted = effectiveDailyStats.targetTasks ? (completedCount / effectiveDailyStats.targetTasks) * 100 : 0;

    // Calculate alert responses for selected date
    let focusedAlerts = achievedOnDate.reduce((sum, task) => sum + (task.focusedAlerts || 0), 0);
    let deviatedAlerts = achievedOnDate.reduce((sum, task) => sum + (task.deviatedAlerts || 0), 0);
    
    // Add sample data if no real alert data exists (for demo purposes)
    if (focusedAlerts === 0 && deviatedAlerts === 0 && achievedOnDate.length > 0) {
      // Distribute sample alerts across completed tasks
      achievedOnDate.forEach((task, index) => {
        if (!task.focusedAlerts && !task.deviatedAlerts) {
          task.focusedAlerts = Math.floor(Math.random() * 5) + 2; // 2-6 focused
          task.deviatedAlerts = Math.floor(Math.random() * 3); // 0-2 deviated
        }
      });
      // Recalculate totals
      focusedAlerts = achievedOnDate.reduce((sum, task) => sum + (task.focusedAlerts || 0), 0);
      deviatedAlerts = achievedOnDate.reduce((sum, task) => sum + (task.deviatedAlerts || 0), 0);
    }
    
    const totalAlerts = focusedAlerts + deviatedAlerts;
    const focusRate = totalAlerts > 0 ? ((focusedAlerts / totalAlerts) * 100).toFixed(0) : '0';

    console.log('🔍 Alert Stats Calculation:', {
      focusedAlerts,
      deviatedAlerts,
      totalAlerts,
      focusRate,
      achievedOnDateCount: achievedOnDate.length,
    });

    return {
      totalPlannedHours: totalPlannedHours.toFixed(1),
      completedHours: completedHours.toFixed(1),
      totalSessions,
      completedCount,
      totalTodoCount: grouped.todo.length,
      plannedVsCompleted: Math.min(plannedVsCompleted, 100).toFixed(0),
      achievedOnDate,
      focusedAlerts,
      deviatedAlerts,
      totalAlerts,
      focusRate,
    };
  }, [grouped, selectedDate, effectiveDailyStats]);

  // Date navigation helpers
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Calendar generation
  const getCalendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [selectedDate]);

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const handleModalAddTask = async (task: Omit<BoardTaskCard, 'id'>) => {
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
        console.log('✅ Task created in modal:', createdTask.id);
        setModalTasks(prev => [...prev, createdTask]);
        setTasksAddedDuringSession(prev => new Set(prev).add(createdTask.id));
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to create task in modal:', errorData);
        throw new Error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('❌ Error creating task in modal:', error);
      throw error;
    }
  };

  const handleModalTaskUpdate = async (taskId: string, updates: Partial<Omit<BoardTaskCard, 'id'>>) => {
    try {
      await onTaskUpdate(taskId, updates);
      // Only update modal state after successful update
      setModalTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));
      // Track that this task was modified during this session (already persisted)
      setTasksModifiedDuringSession(prev => new Set(prev).add(taskId));
      console.log('✅ Task updated in modal');
    } catch (error) {
      console.error('❌ Failed to update task in modal:', taskId, error);
      // Don't update modal state if update failed
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
    } catch (error) {
      console.error('❌ Error deleting task from modal:', error);
      throw error;
    }
  };

  // Initialize original tasks when modal opens AND tasks are available
  useEffect(() => {
    if (open && tasks.length > 0 && originalTasks.length === 0) {
      const timestamp = new Date().toISOString();
      console.log(`📋 [${timestamp}] Setting original tasks snapshot:`, tasks.length, 'tasks');
      console.log(`📋 [${timestamp}] Task IDs at modal open:`, tasks.map(t => t.id));
      console.log(`📋 [${timestamp}] Task titles at modal open:`, tasks.map(t => t.title));
      setOriginalTasks(JSON.parse(JSON.stringify(tasks))); // Deep copy to prevent reference issues
      
      // Reset session tracking for fresh start
      setTasksAddedDuringSession(new Set());
      setTasksModifiedDuringSession(new Set());
      setTasksReorderedDuringSession(new Set());
    }
  }, [open, tasks, originalTasks.length]);

  const resetOriginalTasks = () => {
    setOriginalTasks([]);
  };

  // Reset original tasks when modal closes
  useEffect(() => {
    if (!open) {
      resetOriginalTasks();
    }
  }, [open]);

  const [draggedTask, setDraggedTask] = useState<BoardTaskCard | null>(null);

  const handleDragStart = (task: BoardTaskCard) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent, targetStatus: BoardTaskStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === targetStatus) return;

    console.log(`📦 Moving task "${draggedTask.title}" from ${draggedTask.status} to ${targetStatus}`);

    // Update the task status
    handleModalTaskUpdate(draggedTask.id, { status: targetStatus }).catch(console.error);
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragEndReorder = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = grouped['todo'].findIndex(task => task.id === active.id);
    const newIndex = grouped['todo'].findIndex(task => task.id === over.id);

    const oldModalTasks = modalTasks; // Store old state for revert

    const newOrder = arrayMove(grouped['todo'], oldIndex, newIndex);

    // Update modal tasks with new order and sequential sortOrder for todo tasks
    const updatedTodoTasks = newOrder.map((task, index) => ({
      ...task,
      sortOrder: index,
    }));

    const newModalTasks = modalTasks.map(task =>
      task.status === 'todo' ? updatedTodoTasks.find(ut => ut.id === task.id) || task : task
    );

    setModalTasks(newModalTasks); // Optimistic update

    // Send API call
    if (!projectId) {
      console.warn('No project ID available, skipping reorder persistence');
      return;
    }

    try {
      const taskOrders = updatedTodoTasks.map(task => ({
        id: task.id,
        sortOrder: task.sortOrder,
      }));

      const response = await fetch('/api/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          taskOrders,
        }),
      });

      if (response.ok) {
        console.log('Todo reorder persisted successfully');
      } else {
        console.error('Failed to persist todo reorder');
        setModalTasks(oldModalTasks); // Revert UI
        alert('Failed to save the new order. Please try again.');
      }
    } catch (error) {
      console.error('Error persisting todo reorder:', error);
      setModalTasks(oldModalTasks); // Revert UI
      alert('Error saving the new order. Please try again.');
    }
  };

  const handleClose = async () => {
    // Always close the modal immediately
    onClose();

    // If no project ID, nothing to save
    if (!projectId) {
      console.log('No project ID, modal closed without saving');
      return;
    }

    // Check for changes quickly
    const changes = detectTaskChanges(originalTasks, modalTasks);

    if (changes.length === 0) {
      console.log('ℹ️ No changes detected, modal closed');
      return;
    }

    console.log('💾 Saving changes asynchronously...');

    // Build array of promises for all changes
    const savePromises = changes.map(async (change) => {
      if (change.operation === 'create') {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: change.title,
            priority: change.priority,
            duration: change.duration,
            status: change.status,
            projectId: projectId,
            targetSessions: change.targetSessions,
            dailyGoal: change.dailyGoal,
          }),
        });

        if (response.ok && response.status === 201) {
          console.log(`✅ Task ${change.id} created successfully`);
        } else {
          const responseText = await response.text();
          let errorMessage = 'Unknown error';

          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || 'Unknown error';
          } catch {
            errorMessage = responseText || 'Unknown error';
          }

          console.error(`❌ Failed to create task ${change.id} (${response.status}):`, errorMessage);
        }
      } else if (change.operation === 'update') {
        const response = await fetch('/api/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: change.id,
            updates: {
              title: change.title,
              priority: change.priority,
              duration: change.duration,
              status: change.status,
              targetSessions: change.targetSessions,
              dailyGoal: change.dailyGoal,
              completedAt: change.completedAt,
              sessionsCompleted: change.sessionsCompleted,
              actualDuration: change.actualDuration,
            },
          }),
        });

        if (response.ok && response.status === 200) {
          console.log(`✅ Task ${change.id} updated successfully`);
        } else {
          const responseText = await response.text();
          let errorMessage = 'Unknown error';

          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || 'Unknown error';
          } catch {
            errorMessage = responseText || 'Unknown error';
          }

          console.error(`❌ Failed to update task ${change.id} (${response.status}):`, errorMessage);
        }
      } else if (change.operation === 'delete') {
        const response = await fetch('/api/tasks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: change.id }),
        });

        if (response.ok) {
          // Success - task deleted or was already gone
          console.log(`✅ Task ${change.id} deleted or already gone`);
        } else {
          // Check if it's a "Task not found" error - treat as safe
          let errorMessage = 'Unknown error';

          try {
            const responseText = await response.text();
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || 'Unknown error';
          } catch {
            errorMessage = 'Unknown error';
          }

          // "Task not found" is safe - the task was already deleted or never existed
          if (errorMessage.includes('Task not found') || response.status === 404) {
            console.log(`ℹ️ Task ${change.id} was already deleted or never existed - safe to ignore`);
          } else {
            // Real error - log it
            console.error(`❌ Failed to delete task ${change.id} (${response.status}):`, errorMessage);
          }
        }
      }
    });

    // Execute all promises and handle errors
    try {
      await Promise.all(savePromises);
      console.log('✅ All changes saved successfully');
    } catch (error) {
      console.error('❌ Error saving some changes:', error);
      // Don't throw - changes may have partially succeeded
    }
  };

  const detectTaskChanges = (original: BoardTaskCard[], current: BoardTaskCard[]) => {
    const changes: any[] = [];

    // If original tasks are empty, no changes can be detected
    if (!original || original.length === 0) {
      console.log('🔍 No original tasks available for comparison, skipping change detection');
      return changes;
    }

    const originalMap = new Map(original.map(task => [task.id, task]));
    const currentMap = new Map(current.map(task => [task.id, task]));

    console.log('🔍 Change detection:', {
      originalCount: original.length,
      currentCount: current.length,
      originalIds: original.map(t => t.id),
      currentIds: current.map(t => t.id),
      originalTitles: original.map(t => ({ id: t.id, title: t.title })),
      currentTitles: current.map(t => ({ id: t.id, title: t.title })),
    });

    // Check for new tasks (tasks that exist in current but not in original)
    for (const task of current) {
      if (!originalMap.has(task.id)) {
        // Don't create tasks that were already added and persisted during this session
        if (tasksAddedDuringSession.has(task.id)) {
          console.log('⏭️ Skipping create for task already added this session:', task.id, task.title);
          continue;
        }
        console.log('➕ Detected new task:', task.id, task.title, '(not found in original)');
        changes.push({
          operation: 'create',
          ...task,
        });
      } else {
        console.log('✅ Task exists in both:', task.id, task.title);
      }
    }

    // Check for deleted tasks (tasks that exist in original but not in current)
    for (const task of original) {
      if (!currentMap.has(task.id)) {
        console.log('🗑️ Detected deleted task:', task.id, task.title, '(not found in current)');
        changes.push({
          operation: 'delete',
          id: task.id,
        });
      } else {
        console.log('✅ Task still exists:', task.id, task.title);
      }
    }

    console.log('📊 Change summary:', {
      creates: changes.filter(c => c.operation === 'create').length,
      updates: changes.filter(c => c.operation === 'update').length,
      deletes: changes.filter(c => c.operation === 'delete').length,
      total: changes.length,
    });

    return changes;
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

  const renderTaskCard = (task: BoardTaskCard, columnKey: BoardTaskStatus) => {
    const priority = PRIORITY_META[task.priority];
    const isEditable = task.status === 'todo';
    const allowCollapse = columnKey !== 'achieved';
    const isCollapsed = collapsedTasks[task.id] ?? false;
    const isCurrent = currentTaskId === task.id && task.status !== 'achieved';
    const isCompleted = !!task.completedAt && task.status === 'todo';
    const columnStyles = COLUMN_CARD_STYLES[columnKey];

    if (allowCollapse && isCollapsed) {
      return (
        <div
          key={`${task.id}-collapsed`}
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm text-white/80 transition ${
            isCurrent
              ? 'border-emerald-300/70 bg-emerald-400/10 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
              : isCompleted
              ? 'border-emerald-200/40 bg-emerald-400/5 opacity-75'
              : columnStyles.collapsed
          }`}
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
        className={`rounded-2xl border p-4 shadow-[0_15px_40px_rgba(2,4,12,0.5)] transition ${
          isCurrent
            ? 'border-emerald-300/80 bg-emerald-400/10 shadow-[0_15px_45px_rgba(16,185,129,0.35)]'
            : isCompleted
            ? 'border-emerald-200/50 bg-emerald-400/5 opacity-75'
            : columnStyles.card
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading text-lg font-semibold text-white break-words leading-tight">{task.title}</p>
              {isCompleted && (
                <CheckCircle className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              )}
            </div>
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
            <button
              type="button"
              onClick={() => handleModalDeleteTask(task.id).catch(console.error)}
              className="rounded-full border border-red-400/30 p-2 text-red-200 transition hover:border-red-400/70 hover:text-red-100"
              aria-label="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/70">
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-white/40">
              <Clock3 className="h-3.5 w-3.5" /> Timer
            </span>
            <input
              type="number"
              id={`task-${task.id}-duration`}
              name={`task-${task.id}-duration`}
              min={5}
              max={180}
              step={5}
              value={task.duration}
              onChange={(e) => handleModalTaskUpdate(task.id, { duration: Number(e.target.value) }).catch(console.error)}
              className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white focus:border-[var(--accent-primary)] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-white/40">Priority</span>
            <select
              id={`task-${task.id}-priority`}
              name={`task-${task.id}-priority`}
              value={task.priority}
              onChange={(e) => handleModalTaskUpdate(task.id, { priority: e.target.value as TaskPriority }).catch(console.error)}
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
          {isEditable && !isCompleted && (
            <button
              type="button"
              onClick={() => {
                const nextTitle = window.prompt('Rename task', task.title);
                if (nextTitle && nextTitle.trim()) {
                  handleModalTaskUpdate(task.id, { title: nextTitle.trim() }).catch(console.error);
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 transition hover:border-white/40"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {isEditable && !isCompleted && (
            <button
              type="button"
              onClick={() => {
                handleModalTaskUpdate(task.id, {
                  completedAt: new Date().toISOString(),
                  sessionsCompleted: (task.sessionsCompleted || 0) + 1,
                  actualDuration: task.duration
                }).catch(console.error);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/20"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Complete
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 flex w-full max-w-6xl flex-col rounded-[var(--card-radius-lg)] border border-white/10 bg-[var(--surface-muted)]/95 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.65)] max-h-[90vh] overflow-hidden">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Mission board</p>
            <h2 className="font-heading text-3xl font-semibold text-white">Task control center</h2>
            <p className="text-sm text-white/60">Manage your tasks and track your daily achievements.</p>
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

        <div className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
          <input
            type="text"
            id="new-task-title"
            name="new-task-title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="New task name"
            className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-primary)] focus:outline-none"
          />
          <select
            id="new-task-priority"
            name="new-task-priority"
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
              id="new-task-duration"
              name="new-task-duration"
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
            className="inline-flex w-auto items-center gap-2 self-start justify-self-start rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-white/40 hover:bg-white/15"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#0b1220] shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
              <Plus className="h-3 w-3" />
            </span>
            Add task
          </button>
        </div>

        {taskLimitValidation && (
          <div className={`mb-4 rounded-2xl border p-4 ${
            taskLimitValidation.type === 'success'
              ? 'border-emerald-300/30 bg-emerald-400/10'
              : taskLimitValidation.type === 'warning'
              ? 'border-amber-300/30 bg-amber-400/10'
              : 'border-red-300/30 bg-red-400/10'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  taskLimitValidation.type === 'success' ? 'text-emerald-200' :
                  taskLimitValidation.type === 'warning' ? 'text-amber-200' : 'text-red-200'
                }`}>
                  {taskLimitValidation.message}
                </p>
                {taskLimitValidation.type === 'warning' && (
                  <button
                    type="button"
                    onClick={handleClearCompleted}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Completed Tasks
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setTaskLimitValidation(null)}
                className="rounded-full border border-white/20 p-1 text-white/60 transition hover:text-white"
                aria-label="Dismiss message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid flex-1 gap-6 overflow-y-auto pr-2 md:grid-cols-2">
          {COLUMN_CONFIG.map((column) => (
            <div
              key={column.key}
              className="flex min-h-0 flex-col rounded-[24px] border border-white/12 bg-white/5 p-4 shadow-[0_25px_50px_rgba(3,6,15,0.45)] backdrop-blur-xl transition hover:border-white/20"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${column.badgeClass}`}
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
                  {column.key === 'todo' && (
                    <>
                      <span className="text-sm font-semibold">{grouped[column.key].length}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedColumns((prev) => ({ ...prev, [column.key]: !prev[column.key as 'todo'] }))
                        }
                        className="rounded-full border border-white/10 p-1 text-white/60 transition hover:text-white"
                        aria-label={`${collapsedColumns[column.key as 'todo'] ? 'Expand' : 'Collapse'} ${column.label}`}
                      >
                        {collapsedColumns[column.key as 'todo'] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0 pt-4">
                {column.key === 'todo' ? (
                  collapsedColumns[column.key as 'todo'] ? (
                    <div className="h-full space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                      {grouped[column.key].length ? (
                        grouped[column.key].map((task) => {
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
                                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.15em]"
                                    style={{ background: priority.pillBg, color: priority.color }}
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
                                  onClick={() => handleModalDeleteTask(task.id).catch(console.error)}
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
                    <div className="h-full space-y-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                      {grouped[column.key].length ? (
                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEndReorder}>
                          <SortableContext items={grouped[column.key].map(t => t.id)} strategy={verticalListSortingStrategy}>
                            {grouped[column.key].map((task) => (
                              <SortableTaskCard key={task.id} task={task} columnKey={column.key} renderTaskCard={renderTaskCard} />
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <p className={`rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-white/40 ${COLUMN_CARD_STYLES[column.key].card}`}>
                          No tasks yet
                        </p>
                      )}
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col space-y-2" data-stats-version="v2-enhanced">
                    {/* Date Navigator & Calendar */}
                    <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/5 p-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => navigateDate('prev')}
                          className="rounded-lg p-1.5 text-emerald-300 transition hover:bg-emerald-400/10"
                          aria-label="Previous day"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/10"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          <div className="text-center">
                            <div className="text-[10px] text-emerald-300/70">
                              {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="font-bold">
                              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          {isToday && (
                            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[9px] text-emerald-200">Today</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateDate('next')}
                          disabled={isToday}
                          className="rounded-lg p-1.5 text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Next day"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Calendar Picker */}
                      {showCalendar && (
                        <div className="mt-2 rounded-xl border border-emerald-300/30 bg-emerald-400/5 p-3">
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-3">
                            <button
                              type="button"
                              onClick={() => navigateMonth('prev')}
                              className="rounded-lg p-1 text-emerald-300 transition hover:bg-emerald-400/10"
                              aria-label="Previous month"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            
                            <div className="text-sm font-bold text-emerald-200">
                              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>

                            <button
                              type="button"
                              onClick={() => navigateMonth('next')}
                              className="rounded-lg p-1 text-emerald-300 transition hover:bg-emerald-400/10"
                              aria-label="Next month"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Weekday Headers */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                              <div key={day} className="text-center text-[9px] font-semibold text-emerald-300/60 uppercase">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {getCalendarDays.map((day, index) => {
                              if (!day) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                              }

                              const isSelected = day.toDateString() === selectedDate.toDateString();
                              const isDayToday = day.toDateString() === new Date().toDateString();
                              const isFuture = day > new Date();

                              return (
                                <button
                                  key={day.toISOString()}
                                  type="button"
                                  onClick={() => !isFuture && selectDate(day)}
                                  disabled={isFuture}
                                  className={`aspect-square rounded-lg text-[10px] font-semibold transition ${
                                    isSelected
                                      ? 'bg-emerald-400/30 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                      : isDayToday
                                      ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-300/30'
                                      : isFuture
                                      ? 'text-emerald-300/30 cursor-not-allowed'
                                      : 'text-emerald-200/70 hover:bg-emerald-400/10 hover:text-emerald-200'
                                  }`}
                                >
                                  {day.getDate()}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Actions */}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => selectDate(new Date())}
                              className="flex-1 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCalendar(false)}
                              className="flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/70 transition hover:bg-white/10"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Comprehensive Stats Grid */}
                    <div className="rounded-xl border border-emerald-300/30 bg-gradient-to-br from-emerald-400/10 to-emerald-500/5 p-3 shadow-[0_4px_20px_rgba(16,185,129,0.1)]">
                      {/* Compact Stats Grid - 6 metrics in 2 rows */}
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {/* Streak */}
                        <div className="rounded-lg bg-orange-400/5 p-2 border border-orange-300/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Flame className="h-3 w-3 text-orange-300" />
                            <span className="text-[9px] uppercase tracking-wider text-orange-300/70">Streak</span>
                          </div>
                          <div className="text-lg font-bold text-orange-200">
                            {effectiveDailyStats.achieved ? '🔥' : '⏳'} {comprehensiveStats.completedCount > 0 ? '1' : '0'}
                          </div>
                        </div>

                        {/* Total Sessions */}
                        <div className="rounded-lg bg-cyan-400/5 p-2 border border-cyan-300/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Zap className="h-3 w-3 text-cyan-300" />
                            <span className="text-[9px] uppercase tracking-wider text-cyan-300/70">Sessions</span>
                          </div>
                          <div className="text-lg font-bold text-cyan-200">
                            {comprehensiveStats.totalSessions}
                          </div>
                        </div>

                        {/* Planned Hours */}
                        <div className="rounded-lg bg-violet-400/5 p-2 border border-violet-300/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="h-3 w-3 text-violet-300" />
                            <span className="text-[9px] uppercase tracking-wider text-violet-300/70">Planned</span>
                          </div>
                          <div className="text-lg font-bold text-violet-200">
                            {comprehensiveStats.totalPlannedHours}h
                          </div>
                        </div>

                        {/* Completed Count */}
                        <div className="rounded-lg bg-emerald-400/5 p-2 border border-emerald-300/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ListChecks className="h-3 w-3 text-emerald-300" />
                            <span className="text-[9px] uppercase tracking-wider text-emerald-300/70">Done</span>
                          </div>
                          <div className="text-lg font-bold text-emerald-200">
                            {comprehensiveStats.completedCount}
                          </div>
                        </div>

                        {/* Completed Hours */}
                        <div className="rounded-lg bg-blue-400/5 p-2 border border-blue-300/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock3 className="h-3 w-3 text-blue-300" />
                            <span className="text-[9px] uppercase tracking-wider text-blue-300/70">Actual</span>
                          </div>
                          <div className="text-lg font-bold text-blue-200">
                            {comprehensiveStats.completedHours}h
                          </div>
                        </div>

                        {/* Planned vs Completed */}
                        <div className="rounded-lg bg-pink-400/5 p-2 border border-pink-300/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="h-3 w-3 text-pink-300" />
                            <span className="text-[9px] uppercase tracking-wider text-pink-300/70">Progress</span>
                          </div>
                          <div className="text-lg font-bold text-pink-200">
                            {comprehensiveStats.plannedVsCompleted}%
                          </div>
                        </div>
                      </div>

                      {/* Alert Tracking Stats */}
                      <div className="mt-2 rounded-lg bg-indigo-400/5 border border-indigo-300/20 p-2" data-alert-stats="visible">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3 text-indigo-300" />
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-200">Stay-on-Task Alerts</span>
                          </div>
                          <span className="text-[9px] text-indigo-300/60">{comprehensiveStats.totalAlerts} total</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {/* Focused Responses */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Focus className="h-3 w-3 text-green-300" />
                              <span className="text-[8px] text-green-300/70">Focused</span>
                            </div>
                            <div className="text-sm font-bold text-green-200">
                              {comprehensiveStats.focusedAlerts}
                            </div>
                          </div>

                          {/* Deviated Responses */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <EyeOff className="h-3 w-3 text-red-300" />
                              <span className="text-[8px] text-red-300/70">Deviated</span>
                            </div>
                            <div className="text-sm font-bold text-red-200">
                              {comprehensiveStats.deviatedAlerts}
                            </div>
                          </div>

                          {/* Focus Rate */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Target className="h-3 w-3 text-indigo-300" />
                              <span className="text-[8px] text-indigo-300/70">Focus Rate</span>
                            </div>
                            <div className="text-sm font-bold text-indigo-200">
                              {comprehensiveStats.focusRate}%
                            </div>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-2 h-1.5 w-full rounded-full bg-indigo-900/30 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-300 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                            style={{ width: `${comprehensiveStats.focusRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Summary */}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-emerald-300/60">
                        <span>📊 {comprehensiveStats.totalTodoCount} tasks in backlog</span>
                        <span>⏰ {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Day-wise Achievements */}
                    <div className="flex-1 min-h-0 rounded-xl border border-emerald-300/20 bg-emerald-400/5 p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Completed on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h4>
                        <span className="text-[9px] text-emerald-300/60">{comprehensiveStats.achievedOnDate.length} tasks</span>
                      </div>
                      
                      <div className="h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-300/20">
                        {comprehensiveStats.achievedOnDate.length ? (
                          <div className="space-y-1.5">
                            {comprehensiveStats.achievedOnDate.map((task) => (
                              <div
                                key={task.id}
                                className="group rounded-lg border border-emerald-300/20 bg-emerald-400/5 p-2 transition hover:border-emerald-300/40 hover:bg-emerald-400/10"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <CheckCircle className="h-3 w-3 text-emerald-300 flex-shrink-0" />
                                      <p className="font-semibold text-xs text-emerald-100 truncate">{task.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-emerald-300/60">
                                      <span>{task.duration}m</span>
                                      {task.completedAt && (
                                        <span>{new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Alert Response Indicators */}
                                  {((task.focusedAlerts || 0) + (task.deviatedAlerts || 0)) > 0 && (
                                    <div className="flex items-center gap-2 text-[8px]">
                                      <div className="flex items-center gap-1">
                                        <Focus className="h-2.5 w-2.5 text-green-300" />
                                        <span className="text-green-300/70">{task.focusedAlerts || 0}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <EyeOff className="h-2.5 w-2.5 text-red-300" />
                                        <span className="text-red-300/70">{task.deviatedAlerts || 0}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-center py-6">
                              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 mb-2">
                                <Trophy className="h-6 w-6 text-emerald-300/50" />
                              </div>
                              <p className="text-xs font-semibold text-emerald-200/70 mb-1">No tasks completed</p>
                              <p className="text-[10px] text-emerald-300/50">on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// SortableTaskCard component
const SortableTaskCard = ({ task, columnKey, renderTaskCard }: {
  task: BoardTaskCard;
  columnKey: BoardTaskStatus;
  renderTaskCard: (task: BoardTaskCard, columnKey: BoardTaskStatus) => React.ReactElement;
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      {renderTaskCard(task, columnKey)}
    </div>
  );
};
