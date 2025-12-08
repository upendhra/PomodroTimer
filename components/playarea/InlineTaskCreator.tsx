'use client';

import { Check, StickyNote, X } from 'lucide-react';
import { TaskPriority, PRIORITY_META } from './types';

interface InlineTaskCreatorProps {
  title: string;
  priority: TaskPriority;
  notes: string;
  notesOpen: boolean;
  onTitleChange: (value: string) => void;
  onPriorityChange: (value: TaskPriority) => void;
  onToggleNotes: () => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];

export default function InlineTaskCreator({
  title,
  priority,
  notes,
  notesOpen,
  onTitleChange,
  onPriorityChange,
  onToggleNotes,
  onNotesChange,
  onSave,
  onCancel,
}: InlineTaskCreatorProps) {
  return (
    <div className="border-b border-white/5 bg-white/5/20 px-6 py-5 backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Name the mission..."
            className="flex-1 rounded-2xl border border-white/10 bg-[var(--surface-base)]/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[var(--accent-primary)] focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            {PRIORITIES.map((level) => {
              const meta = PRIORITY_META[level];
              const isActive = level === priority;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onPriorityChange(level)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    isActive ? 'border-white text-white' : 'border-white/15 text-white/60 hover:text-white'
                  }`}
                  style={{
                    background: isActive ? meta.pillBg : 'transparent',
                    color: isActive ? meta.color : undefined,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="Toggle notes"
            onClick={onToggleNotes}
            className={`rounded-full border border-white/10 p-2 transition ${
              notesOpen ? 'border-white/40 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <StickyNote className="h-4 w-4" />
          </button>
        </div>

        {notesOpen && (
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add context, links, or acceptance notes..."
            className="min-h-[96px] rounded-2xl border border-white/10 bg-[var(--surface-base)]/40 px-4 py-3 text-sm text-white placeholder:text-white/45 focus:border-[var(--accent-success)] focus:outline-none"
          />
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 transition hover:text-white"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#0b1220] transition hover:brightness-105"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <Check className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
