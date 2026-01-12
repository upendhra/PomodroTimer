'use client';

import { Bell, Pause, Play, RotateCcw } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  activeControl: 'play' | 'pause' | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAlertSettings: () => void;
  isLightTheme?: boolean;
}

export default function TimerControls({
  isRunning,
  activeControl,
  onStart,
  onPause,
  onReset,
  onAlertSettings,
  isLightTheme = false,
}: TimerControlsProps) {
  const lightAccentStyle = {
    background: 'linear-gradient(135deg, var(--accent-1, #7c3aed), var(--accent-2, #22d3ee))',
    color: 'var(--text-on-accent, #ffffff)',
    boxShadow: '0 18px 30px rgba(15,23,42,0.18), 0 8px 18px rgba(15,23,42,0.12)',
  } as const;

  const lightGlassButton = {
    backgroundColor: 'var(--glass-surface, rgba(255, 255, 255, 0.55))',
    borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.45))',
    color: 'var(--text-primary, #0B1220)',
    boxShadow: 'var(--glass-shadow-1, 0 8px 32px rgba(31, 38, 135, 0.12)), var(--glass-shadow-2, 0 2px 8px rgba(31, 38, 135, 0.08))',
  } as const;

  const controlConfig = [
    {
      label: 'Start focus',
      icon: Play,
      onClick: onStart,
      disabled: false,
      key: 'play' as const,
      className: isLightTheme
        ? 'hover:brightness-105'
        : 'bg-[var(--accent-primary)] text-white shadow-[0_15px_35px_rgba(124,58,237,0.35)] hover:brightness-110',
      style: isLightTheme ? lightAccentStyle : undefined,
    },
    {
      label: 'Pause focus',
      icon: Pause,
      onClick: onPause,
      disabled: !isRunning,
      key: 'pause' as const,
      className: isLightTheme
        ? 'border hover:bg-white/70 disabled:border-black/5 disabled:text-black/30'
        : 'border border-white/15 bg-black/40 text-white/80 hover:bg-black/50 hover:text-white disabled:border-white/5 disabled:text-white/30',
      style: isLightTheme ? lightGlassButton : undefined,
    },
    {
      label: 'Reset timer',
      icon: RotateCcw,
      onClick: onReset,
      disabled: false,
      key: 'reset' as const,
      className: isLightTheme
        ? 'hover:bg-white/70'
        : 'bg-black/40 text-white/70 hover:bg-black/50',
      style: isLightTheme ? lightGlassButton : undefined,
    },
    {
      label: 'Alert interval settings',
      icon: Bell,
      onClick: onAlertSettings,
      disabled: false,
      key: 'alert' as const,
      className: isLightTheme
        ? 'border border-amber-200/70 bg-amber-100/60 text-amber-900 hover:bg-amber-200/70'
        : 'border border-amber-300/70 bg-amber-400/15 text-amber-100 shadow-[0_12px_32px_rgba(251,191,36,0.35)] hover:border-amber-200/80 hover:text-white',
      style: isLightTheme
        ? {
            color: '#78350f',
            boxShadow: '0 10px 24px rgba(245, 158, 11, 0.25)',
          }
        : undefined,
    },
  ];

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      {controlConfig.map(({ label, icon: Icon, onClick, disabled, className, key, style }) => {
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
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isLightTheme ? 'focus-visible:outline-[rgba(15,23,42,0.6)]' : 'focus-visible:outline-white/80'
            } ${
              isHighlighted
                ? isLightTheme
                  ? 'ring-2 ring-[rgba(15,23,42,0.35)] shadow-[0_0_30px_rgba(15,23,42,0.25)]'
                  : 'ring-2 ring-white/70 shadow-[0_0_25px_rgba(255,255,255,0.45)]'
                : ''
            } ${className}`}
            style={style}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}
