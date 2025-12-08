'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  activeControl: 'play' | 'pause' | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function TimerControls({ isRunning, activeControl, onStart, onPause, onReset }: TimerControlsProps) {
  const controlConfig = [
    {
      label: 'Start focus',
      icon: Play,
      onClick: onStart,
      disabled: false,
      key: 'play' as const,
      className: 'bg-[var(--accent-primary)] text-white shadow-[0_15px_35px_rgba(124,58,237,0.35)] hover:brightness-110',
    },
    {
      label: 'Pause focus',
      icon: Pause,
      onClick: onPause,
      disabled: !isRunning,
      key: 'pause' as const,
      className: 'border border-white/15 text-white/80 hover:text-white disabled:border-white/5 disabled:text-white/30',
    },
    {
      label: 'Reset timer',
      icon: RotateCcw,
      onClick: onReset,
      disabled: false,
      key: 'reset' as const,
      className: 'bg-white/5 text-white/70 hover:bg-white/10',
    },
  ];

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      {controlConfig.map(({ label, icon: Icon, onClick, disabled, className, key }) => {
        const isHighlighted = (key === 'play' && activeControl === 'play') || (key === 'pause' && activeControl === 'pause');
        return (
          <button
            key={label}
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={label}
            aria-label={label}
            aria-pressed={key === 'play' || key === 'pause' ? isHighlighted : undefined}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${
              isHighlighted ? 'ring-2 ring-white/70 shadow-[0_0_25px_rgba(255,255,255,0.45)]' : ''
            } ${className}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}
