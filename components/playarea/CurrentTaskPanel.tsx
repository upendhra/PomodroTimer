'use client';

import { PlayCircle } from 'lucide-react';
import { PlayTask, PRIORITY_META } from './types';

interface CurrentTaskPanelProps {
  task?: PlayTask | null;
}

export default function CurrentTaskPanel({ task }: CurrentTaskPanelProps) {
  if (!task) {
    return (
      <div className="rounded-[var(--card-radius-md)] border border-white/10 bg-[var(--surface-muted)] px-6 py-5 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">No active task</p>
        <p className="font-heading mt-3 text-xl font-semibold text-white">Pick a task to start a focused sprint ✨</p>
      </div>
    );
  }

  const priority = PRIORITY_META[task.priority];

  return (
    <div className="rounded-[var(--card-radius-md)] border border-white/10 bg-[var(--surface-muted)] px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">Current task</p>
          <h3 className="font-heading mt-1 text-2xl font-semibold text-white">{task.title}</h3>
          <div
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: priority.pillBg, color: priority.color }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: priority.color }}></span>
            {priority.label}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/20"
        >
          <PlayCircle className="h-4 w-4" />
          Guide me
        </button>
      </div>
      {task.notes && <p className="mt-4 text-sm text-white/70">{task.notes}</p>}
    </div>
  );
}
