'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function TimerControls({ isRunning, onStart, onPause, onReset }: TimerControlsProps) {
  const controlConfig = [
    {
      label: 'Start focus',
      icon: Play,
      onClick: onStart,
      disabled: false,
      className: 'bg-[var(--accent-primary)] text-white shadow-[0_15px_35px_rgba(124,58,237,0.35)] hover:brightness-110',
    },
    {
      label: 'Pause focus',
      icon: Pause,
      onClick: onPause,
      disabled: !isRunning,
      className: 'border border-white/15 text-white/80 hover:text-white disabled:border-white/5 disabled:text-white/30',
    },
    {
      label: 'Reset timer',
      icon: RotateCcw,
      onClick: onReset,
      disabled: false,
      className: 'bg-white/5 text-white/70 hover:bg-white/10',
    },
  ];

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      {controlConfig.map(({ label, icon: Icon, onClick, disabled, className }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          disabled={disabled}
          title={label}
          aria-label={label}
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${className}`}
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
