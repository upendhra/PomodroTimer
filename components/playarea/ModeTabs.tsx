'use client';

import { Coffee, Moon, Target } from 'lucide-react';

const MODES = [
  { key: 'focus', label: 'Focus sprint', icon: Target },
  { key: 'short', label: 'Short break', icon: Coffee },
  { key: 'long', label: 'Long break', icon: Moon },
] as const;

interface ModeTabsProps {
  activeMode: string;
  onChange: (mode: string) => void;
}

export default function ModeTabs({ activeMode, onChange }: ModeTabsProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 backdrop-blur">
        {MODES.map((mode) => {
          const isActive = activeMode === mode.key;
          const Icon = mode.icon;
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => onChange(mode.key)}
              title={mode.label}
              aria-label={mode.label}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition ${
                isActive
                  ? 'bg-white text-[#0b1220] shadow-[0_4px_12px_rgba(15,23,42,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#0b1220]' : 'text-white/80'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
