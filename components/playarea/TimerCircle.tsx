'use client';

interface TimerCircleProps {
  timeLeft: number; // seconds
  duration: number; // seconds
  modeLabel: string;
  isRunning: boolean;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function TimerCircle({ timeLeft, duration, modeLabel, isRunning }: TimerCircleProps) {
  const progress = Math.max(0, Math.min(1, 1 - timeLeft / duration));
  const size = 256;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const label = modeLabel.replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="w-full">
      <div className="relative mx-auto h-64 w-64">
        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#timerGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            fill="transparent"
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Time left</p>
          <p className="font-heading mt-2 text-6xl font-semibold text-white">{formatTime(timeLeft)}</p>
          <p className={`mt-2 text-sm font-semibold ${isRunning ? 'text-[#22d3ee]' : 'text-white/40'}`}>
            {isRunning ? 'In flow' : 'Paused'}
          </p>
        </div>
      </div>
    </div>
  );
}
