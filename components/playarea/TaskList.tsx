'use client';

import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import TaskRow from './TaskRow';
import InlineTaskCreator from './InlineTaskCreator';
import CompletedTasksSection from './CompletedTasksSection';
import { PlayTask, priorityOrder, TaskPriority } from './types';

interface TaskListProps {
  tasks: PlayTask[];
  completedTasks: PlayTask[];
  activeTaskId: string | null;
  showCreator: boolean;
  creatorTitle: string;
  creatorPriority: TaskPriority;
  creatorNotes: string;
  creatorNotesOpen: boolean;
  onToggleComplete: (id: string) => void;
  onStartTask: (id: string) => void;
  onToggleCreator: (open: boolean) => void;
  onCreatorTitleChange: (value: string) => void;
  onCreatorPriorityChange: (value: TaskPriority) => void;
  onCreatorNotesToggle: () => void;
  onCreatorNotesChange: (value: string) => void;
  onSaveTask: () => void;
}

export default function TaskList({
  tasks,
  completedTasks,
  activeTaskId,
  showCreator,
  creatorTitle,
  creatorPriority,
  creatorNotes,
  creatorNotesOpen,
  onToggleComplete,
  onStartTask,
  onToggleCreator,
  onCreatorTitleChange,
  onCreatorPriorityChange,
  onCreatorNotesToggle,
  onCreatorNotesChange,
  onSaveTask,
}: TaskListProps) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));
  }, [tasks]);

  return (
    <div className="rounded-[var(--card-radius-lg)] border border-white/10 bg-[var(--surface-muted)]/70 shadow-[0_35px_80px_rgba(3,5,12,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/50">Mission queue</p>
          <h3 className="font-heading text-2xl font-semibold text-white">Pending tasks</h3>
          <p className="text-sm text-white/50">{sortedTasks.length} active · {completedTasks.length} completed</p>
        </div>
        <button
          type="button"
          aria-label="Add task"
          onClick={() => onToggleCreator(true)}
          disabled={showCreator}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          New task
        </button>
      </div>

      {showCreator && (
        <InlineTaskCreator
          title={creatorTitle}
          priority={creatorPriority}
          notes={creatorNotes}
          notesOpen={creatorNotesOpen}
          onTitleChange={onCreatorTitleChange}
          onPriorityChange={onCreatorPriorityChange}
          onToggleNotes={onCreatorNotesToggle}
          onNotesChange={onCreatorNotesChange}
          onSave={onSaveTask}
          onCancel={() => onToggleCreator(false)}
        />
      )}

      <div className="divide-y divide-white/5">
        {sortedTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isActive={task.id === activeTaskId}
            onToggleComplete={onToggleComplete}
            onStartTask={onStartTask}
          />
        ))}

        {!sortedTasks.length && !showCreator && (
          <div className="px-6 py-10 text-center">
            <p className="font-heading text-lg text-white">No missions queued</p>
            <p className="mt-2 text-sm text-white/60">Draft what you’d like to tackle next and keep momentum high.</p>
          </div>
        )}
      </div>

      <CompletedTasksSection tasks={completedTasks} onToggleComplete={onToggleComplete} />
    </div>
  );
}
