'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TaskRow from './TaskRow';
import { PlayTask } from './types';

interface CompletedTasksSectionProps {
  tasks: PlayTask[];
  onToggleComplete: (id: string) => void;
}

export default function CompletedTasksSection({ tasks, onToggleComplete }: CompletedTasksSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-white/5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-xs uppercase tracking-[0.35em] text-white/60"
      >
        <span>Completed tasks ({tasks.length})</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="divide-y divide-white/5">
          {tasks.length ? (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isActive={false}
                onToggleComplete={onToggleComplete}
                showStartButton={false}
              />
            ))
          ) : (
            <p className="px-4 py-4 text-xs text-white/50">No completed tasks yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
