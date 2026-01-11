'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Circle, Play, CheckCircle2, Trophy } from 'lucide-react';

type DemoStage = 'task_board' | 'selecting' | 'transitioning' | 'timer_running' | 'completing' | 'celebration';

const DEMO_TASKS = [
  { id: '1', title: 'Design landing page mockups', priority: 'high', duration: 25 },
  { id: '2', title: 'Review pull requests', priority: 'medium', duration: 15 },
  { id: '3', title: 'Update documentation', priority: 'low', duration: 20 },
];

const PRIORITY_STYLES = {
  high: { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', label: 'High Priority' },
  medium: { bg: 'rgba(251, 191, 36, 0.15)', color: '#fcd34d', label: 'Medium' },
  low: { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', label: 'Low Priority' },
};

export default function InteractiveDemo() {
  const [stage, setStage] = useState<DemoStage>('task_board');
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [confettiParticles, setConfettiParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  // Auto-cycle through stages (slower timing for better viewing)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    switch (stage) {
      case 'task_board':
        timer = setTimeout(() => setStage('selecting'), 3500); // 2s → 3.5s
        break;
      case 'selecting':
        timer = setTimeout(() => setStage('transitioning'), 2500); // 1.5s → 2.5s
        break;
      case 'transitioning':
        timer = setTimeout(() => {
          setStage('timer_running');
          setTimeLeft(25 * 60);
        }, 1800); // 1s → 1.8s
        break;
      case 'timer_running':
        timer = setTimeout(() => setStage('completing'), 6000); // 3s → 6s
        break;
      case 'completing':
        timer = setTimeout(() => {
          setStage('celebration');
          // Generate confetti particles
          const particles = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            color: ['#a855f7', '#22d3ee', '#fbbf24', '#f472b6'][Math.floor(Math.random() * 4)],
            delay: Math.random() * 0.5,
          }));
          setConfettiParticles(particles);
        }, 1000); // 0.5s → 1s
        break;
      case 'celebration':
        timer = setTimeout(() => {
          setStage('task_board');
          setConfettiParticles([]);
          setSelectedTaskIndex((prev) => (prev + 1) % DEMO_TASKS.length);
        }, 4000); // 3s → 4s
        break;
    }

    return () => clearTimeout(timer);
  }, [stage]);

  // Countdown timer animation (slower, more realistic)
  useEffect(() => {
    if (stage === 'timer_running' || stage === 'completing') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 2; // Slower countdown (was 5, now 2)
          if (newTime <= 0) {
            clearInterval(interval);
            return 0;
          }
          return newTime;
        });
      }, 200); // Slower interval (was 100ms, now 200ms)
      return () => clearInterval(interval);
    }
  }, [stage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const selectedTask = DEMO_TASKS[selectedTaskIndex];
  const progress = stage === 'timer_running' || stage === 'completing' ? 1 - timeLeft / (25 * 60) : 0;

  // SVG circle calculations
  const size = 256;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto max-w-5xl mt-12">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/20 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-xl p-8">
        
        {/* Task Board Stage */}
        {(stage === 'task_board' || stage === 'selecting') && (
          <div className={`transition-all duration-700 ease-in-out ${stage === 'selecting' ? 'scale-98 opacity-95' : 'scale-100 opacity-100'}`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 backdrop-blur-sm px-4 py-2 text-amber-900 shadow-lg shadow-amber-500/20">
                <ClipboardList className="h-4 w-4 text-amber-700" />
                <span className="text-sm font-bold">To Do</span>
              </div>
              <p className="text-gray-700 text-sm font-medium">Select a task to focus on</p>
            </div>

            <div className="space-y-3">
              {DEMO_TASKS.map((task, index) => {
                const priority = PRIORITY_STYLES[task.priority as keyof typeof PRIORITY_STYLES];
                const isSelected = stage === 'selecting' && index === selectedTaskIndex;
                
                return (
                  <div
                    key={task.id}
                    className={`relative flex items-center gap-4 border rounded-xl px-4 py-4 transition-all duration-300 ${
                      isSelected
                        ? 'border-amber-400 bg-gradient-to-r from-amber-100 to-yellow-100 scale-105 shadow-xl shadow-amber-500/40'
                        : 'border-amber-300/60 bg-white/80 backdrop-blur-sm hover:border-amber-400/80 hover:bg-amber-50/50'
                    }`}
                  >
                    {/* Animated cursor pointer */}
                    {isSelected && (
                      <div className="absolute -left-8 top-1/2 -translate-y-1/2 animate-bounce">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full shadow-lg"></div>
                      </div>
                    )}

                    <button className={`rounded-full border p-2 transition ${
                      isSelected 
                        ? 'border-amber-500 bg-amber-100 text-amber-600' 
                        : 'border-amber-400/60 bg-amber-50 text-amber-500 hover:bg-amber-100'
                    }`}>
                      <Circle className="h-4 w-4" />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-base font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>{task.title}</p>
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold shadow-sm"
                          style={{ background: priority.bg, color: priority.color }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: priority.color }}></span>
                          {priority.label}
                        </span>
                      </div>
                      <p className={`mt-1 text-xs font-medium ${isSelected ? 'text-gray-700' : 'text-gray-600'}`}>{task.duration} minutes</p>
                    </div>

                    <button
                      className={`rounded-full border p-2 transition ${
                        isSelected
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-400 to-cyan-500 text-white scale-110 shadow-lg shadow-cyan-500/50'
                          : 'border-amber-400/60 bg-amber-100 text-amber-600 hover:bg-amber-200 hover:border-amber-500'
                      }`}
                    >
                      <Play className="h-4 w-4" />
                    </button>

                    {/* Selection ripple effect */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-xl border-2 border-cyan-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transition Stage */}
        {stage === 'transitioning' && (
          <div className="flex items-center justify-center h-96 animate-pulse">
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/50" style={{ animation: 'spin 1.5s linear infinite' }}></div>
              <p className="text-gray-700 text-lg font-semibold">Loading Play Area...</p>
            </div>
          </div>
        )}
        
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>

        {/* Timer Running Stage */}
        {(stage === 'timer_running' || stage === 'completing' || stage === 'celebration') && (
          <div className="relative min-h-[500px] -m-8 rounded-3xl overflow-hidden">
            {/* Wallpaper Background */}
            <div className="absolute inset-0">
              {/* Cloudinary wallpaper image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://res.cloudinary.com/dmbpo37li/image/upload/v1736520601/themes/wallpapers/mountain-sunset-landscape_zcfkfj.jpg')"
                }}
              ></div>
              
              {/* Animated gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-purple-900/30 to-black/40 animate-pulse"></div>
              
              {/* Vignette effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60"></div>
            </div>

            {/* Content over wallpaper */}
            <div className="relative z-10 p-8">
              {/* Task info at top */}
              <div className="mb-8 text-center">
                <div className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 mb-4 shadow-lg transition-all duration-500 ${
                  stage === 'celebration' 
                    ? 'border-emerald-400/50 bg-emerald-500/30 backdrop-blur-md scale-110' 
                    : 'border-white/30 bg-black/40 backdrop-blur-md'
                }`}>
                  <CheckCircle2 className={`h-5 w-5 transition-colors duration-500 ${stage === 'celebration' ? 'text-emerald-300' : 'text-cyan-400'}`} />
                  <span className="text-white font-semibold">{selectedTask.title}</span>
                </div>
              </div>

              {/* Timer Circle */}
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
                    stroke="rgba(255,255,255,0.15)"
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
                  {stage === 'celebration' ? (
                    <>
                      <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
                      <p className="text-3xl font-bold text-white drop-shadow-lg mb-2">Complete! 🎉</p>
                      <p className="text-sm font-semibold text-emerald-400">Great focus session!</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Time left</p>
                      <p className="mt-2 text-6xl font-semibold text-white drop-shadow-lg">{formatTime(timeLeft)}</p>
                      <p className="mt-2 text-sm font-semibold text-cyan-400">
                        {stage === 'completing' ? 'Completing...' : 'In flow'}
                      </p>
                    </>
                  )}
                </div>

                {/* Enhanced pulsing glow */}
                <div className={`absolute inset-0 rounded-full blur-3xl animate-pulse -z-10 transition-all duration-500 ${
                  stage === 'celebration'
                    ? 'bg-gradient-to-br from-yellow-500/40 via-emerald-500/40 to-cyan-500/40'
                    : 'bg-gradient-to-br from-purple-500/30 via-cyan-500/30 to-indigo-500/30'
                }`}></div>
              </div>

              {/* Confetti particles overlay */}
              {stage === 'celebration' && confettiParticles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute w-3 h-3 rounded-full animate-bounce"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    backgroundColor: particle.color,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: '1.5s',
                  }}
                ></div>
              ))}

              {/* Stats display during celebration */}
              {stage === 'celebration' && (
                <div className="mt-8 flex items-center justify-center gap-8 animate-fade-in">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">+1</div>
                    <div className="text-xs text-white/60">Session</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">25m</div>
                    <div className="text-xs text-white/60">Focused</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">🔥</div>
                    <div className="text-xs text-white/60">Streak</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Stage indicator dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {['task_board', 'timer_running', 'celebration'].map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                stage === s || (stage === 'selecting' && s === 'task_board') || (stage === 'completing' && s === 'timer_running')
                  ? 'w-8 bg-gradient-to-r from-purple-500 to-cyan-500'
                  : 'w-2 bg-gray-400'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Floating depth elements */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-2xl blur-2xl opacity-60 animate-pulse"></div>
      <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-cyan-400 to-indigo-400 rounded-2xl blur-2xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}
