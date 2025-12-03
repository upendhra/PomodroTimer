'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Play, StickyNote } from 'lucide-react';
import { PlayTask, PRIORITY_META } from './types';

interface TaskRowProps {
  task: PlayTask;
  isActive: boolean;
  onToggleComplete: (id: string) => void;
  onStartTask?: (id: string) => void;
  showStartButton?: boolean;
}

export default function TaskRow({ task, isActive, onToggleComplete, onStartTask, showStartButton = true }: TaskRowProps) {
  const [showNotes, setShowNotes] = useState(false);
  const priority = PRIORITY_META[task.priority];

  return (
    <div className="flex flex-col">
      <div
        className={`flex items-center gap-4 border border-transparent px-4 py-4 text-sm transition ${
          task.completed
            ? 'text-white/50'
            : isActive
              ? 'border-white/20 bg-white/5 text-white'
              : 'text-white/80 hover:border-white/10 hover:bg-white/5'
        }`}
      >
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`rounded-full border border-white/15 p-2 text-white/70 transition hover:text-white ${
            task.completed ? 'bg-emerald-400/10 text-emerald-200' : ''
          }`}
        >
          {task.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-base font-semibold text-white">{task.title}</p>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em]"
              style={{ background: priority.pillBg, color: priority.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: priority.color }}></span>
              {priority.label}
            </span>
          </div>
          {!task.completed && (
            <p className="mt-1 text-xs text-white/50">{priority.description}</p>
          )}
        </div>
        <button
          type="button"
          aria-label="Toggle notes"
          onClick={() => setShowNotes((prev) => !prev)}
          className={`rounded-full border border-white/10 p-2 text-white/60 transition hover:text-white ${
            task.notes ? '' : 'opacity-30'
          }`}
        >
          <StickyNote className="h-4 w-4" />
        </button>
        {showStartButton && onStartTask && (
          <button
            type="button"
            aria-label="Set active task"
            onClick={() => onStartTask(task.id)}
            disabled={task.completed}
            className={`rounded-full border border-white/15 p-2 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-white/30 ${
              isActive ? 'border-[#22d3ee] bg-white/10 text-[#22d3ee]' : ''
            }`}
          >
            <Play className="h-4 w-4" />
          </button>
        )}
      </div>
      {task.notes && showNotes && (
        <div className="border-l border-white/10 px-8 pb-4 text-xs text-white/60">{task.notes}</div>
      )}
    </div>
  );
}
