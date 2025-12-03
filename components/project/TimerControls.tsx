'use client';

import { Play, Pause, Square, RotateCcw, Coffee } from 'lucide-react';

interface TimerControlsProps {
  isRunning: boolean;
  isBreak: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onBreakToggle: () => void;
}

export default function TimerControls({
  isRunning,
  isBreak,
  onStart,
  onStop,
  onReset,
  onBreakToggle
}: TimerControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onStart}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isRunning
            ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
        }`}
      >
        {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isRunning ? 'Pause' : 'Start'}
      </button>

      <button
        onClick={onStop}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
      >
        <Square className="w-4 h-4" />
        Stop
      </button>

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </button>

      <button
        onClick={onBreakToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isBreak
            ? 'bg-orange-500/30 text-orange-400'
            : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
        }`}
      >
        <Coffee className="w-4 h-4" />
        Break
      </button>
    </div>
  );
}
