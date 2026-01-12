'use client';

import { useEffect, useState } from 'react';

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

  // Detect if current theme is a light theme
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme') || '';
      const lightThemes = [
        'spotlight-morning-glow',
        'spotlight-pastel-studio',
        'spotlight-cloud-beam',
        'spotlight-golden-hour',
        'spotlight-minimal-veil',
        'spotlight-royal-porcelain',
        'spotlight-pearl-aurora',
        'spotlight-champagne-silk'
      ];
      setIsLightTheme(lightThemes.includes(theme));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  // Get CSS variables for theme-aware colors
  const timerRingStart = isLightTheme ? 'var(--timer-ring-start, #7c3aed)' : '#7c3aed';
  const timerRingEnd = isLightTheme ? 'var(--timer-ring-end, #22d3ee)' : '#22d3ee';
  const trackColor = isLightTheme ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.08)';
  const textPrimary = isLightTheme ? 'var(--text-primary, #0B1220)' : '#ffffff';
  const textSecondary = isLightTheme ? 'var(--text-secondary, #475569)' : 'rgba(255, 255, 255, 0.5)';
  const accentColor = isLightTheme ? 'var(--accent-1, #7c3aed)' : '#22d3ee';

  return (
    <div className="w-full">
      <div className="relative mx-auto h-64 w-64">
        <svg width={size} height={size} className="rotate-[-90deg] relative z-10">
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={timerRingStart} />
              <stop offset="100%" stopColor={timerRingEnd} />
            </linearGradient>
            {isLightTheme && (
              <filter id="timerShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
            )}
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
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
            style={isLightTheme ? { filter: 'url(#timerShadow)' } : {}}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p 
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: textSecondary }}
          >
            Time left
          </p>
          <p 
            className="font-heading mt-2 text-6xl font-semibold"
            style={{ color: textPrimary }}
          >
            {formatTime(timeLeft)}
          </p>
          <p 
            className="mt-2 text-sm font-semibold"
            style={{ color: isRunning ? accentColor : textSecondary }}
          >
            {isRunning ? 'In flow' : 'Paused'}
          </p>
        </div>
      </div>
    </div>
  );
}
