"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Coffee, Zap, Clock3, CheckCircle2, Sparkles } from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  detail: string;
};

const TASKS = [
  {
    id: 1,
    title: "Deep Work Sprint",
    duration: "25 min",
    status: "Focusing now",
    accent: "from-rose-400 via-amber-300 to-yellow-200",
  },
  {
    id: 2,
    title: "Storyboard Review",
    duration: "15 min",
    status: "Up next",
    accent: "from-cyan-400 via-blue-400 to-indigo-400",
  },
  {
    id: 3,
    title: "Mindful Break",
    duration: "05 min",
    status: "Scheduled",
    accent: "from-emerald-400 via-teal-400 to-lime-300",
  },
];

export default function PomodoroShowcase() {
  const focusDuration = 25 * 60;
  const demoLoopSeconds = 15; // complete 25-minute cycle in ~15s for demo
  const tickIntervalMs = 100;

  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [sessionOffset, setSessionOffset] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTimeoutRef = useRef<number | null>(null);

  const size = 240;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const timerProgress = useMemo(() => 1 - timeLeft / focusDuration, [timeLeft, focusDuration]);
  const dashOffset = circumference * (1 - timerProgress);

  useEffect(() => {
    const ticksPerLoop = (demoLoopSeconds * 1000) / tickIntervalMs;
    const decrementPerTick = focusDuration / ticksPerLoop;

    const clearCelebration = () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }
    };

    const triggerCelebration = () => {
      clearCelebration();
      setShowCelebration(true);
      celebrationTimeoutRef.current = window.setTimeout(() => {
        setShowCelebration(false);
        celebrationTimeoutRef.current = null;
      }, 1000);
    };

    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - decrementPerTick;
        if (next <= 0.5) {
          setSessionOffset((count) => count + 1);
          triggerCelebration();
          return focusDuration;
        }
        return next;
      });
    }, tickIntervalMs);

    return () => {
      window.clearInterval(intervalId);
      clearCelebration();
    };
  }, [focusDuration, demoLoopSeconds, tickIntervalMs]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const stats: StatCard[] = [
    { label: "Focus Score", value: "92%", detail: "+8% vs last week" },
    { label: "Sessions Today", value: `${4 + sessionOffset}`, detail: "2 in deep work" },
    { label: "Streak", value: `${12 + sessionOffset} days`, detail: "🔥 Don't break it" },
  ];

  return (
    <div className="relative mx-auto max-w-6xl mt-16">
      <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-purple-400/20 via-cyan-400/15 to-pink-400/20 -z-10" />

      <div className="relative grid gap-8 md:grid-cols-[1.15fr_0.85fr] rounded-[32px] border border-white/30 bg-white/60 p-8 shadow-[0_25px_80px_rgba(82,63,169,0.18)] backdrop-blur-2xl">
        {/* Task board column */}
        <div className="rounded-3xl border border-amber-200/80 bg-white/85 p-6 shadow-lg shadow-amber-200/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-500">Task Flow</p>
              <h3 className="text-2xl font-semibold text-gray-900">Pomodoro Planner</h3>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-600">
              <Flame className="h-4 w-4" />
              Laser focus
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {TASKS.map((task) => (
              <div
                key={task.id}
                className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-white px-5 py-4 shadow-[0_15px_35px_rgba(251,191,36,0.08)]"
              >
                <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${task.accent}`} aria-hidden />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">{task.title}</p>
                    <p className="text-xs font-medium text-gray-500">{task.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{task.duration}</p>
                    <span className="text-xs font-medium text-amber-500">Pomodoro</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
                  <Clock3 className="h-3.5 w-3.5 text-amber-400" />
                  Focus playlist, breathing reminder, auto-break
                </div>
                <div className="absolute inset-0 rounded-2xl border border-transparent opacity-0 transition group-hover:opacity-100 group-hover:border-amber-300"></div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-inner">
                <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[11px] font-medium text-emerald-500">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timer column */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-b from-[#fdfbff] via-[#e9f1ff] to-[#b7c6ec] shadow-[0_30px_90px_rgba(120,134,177,0.3)]">
          {/* Lightning spotlight */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 left-6 h-60 w-60 rotate-[12deg] rounded-full bg-gradient-to-br from-white/80 via-cyan-200/30 to-transparent opacity-70 blur-3xl shadow-[0_0_70px_rgba(125,211,252,0.35)] mix-blend-screen animate-pulse" />
            <div
              className="absolute top-10 left-1/2 h-72 w-72 -translate-x-1/2 opacity-70 blur-3xl mix-blend-screen"
              style={{
                background: "radial-gradient(circle, rgba(168,85,247,0.65) 0%, rgba(6,182,212,0.35) 45%, rgba(255,255,255,0) 75%)",
              }}
            />
          </div>

          <div className="relative z-10 p-8 text-[#1d2143]">
            <div className="flex items-center justify-between text-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#1d2143] shadow-sm">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                Flow Session
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#5c6689]">Current Task</p>
                <p className="text-base font-semibold text-[#1c1f38]">Deep Work Sprint</p>
              </div>
            </div>

            <div className="relative mx-auto mt-10 h-64 w-64">
              <svg width={size} height={size} className="rotate-[-90deg]">
                <defs>
                  <linearGradient id="heroTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7f5af0" />
                    <stop offset="50%" stopColor="#5dd4f2" />
                    <stop offset="100%" stopColor="#7cfbcb" />
                  </linearGradient>
                  <linearGradient id="heroTimerGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                </defs>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="url(#heroTimerGlow)"
                  strokeWidth={strokeWidth + 6}
                  fill="transparent"
                  opacity={0.5}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="url(#heroTimerGradient)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  fill="transparent"
                  className="transition-[stroke-dashoffset] duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#7d89b1]">Focus</p>
                <p className="text-6xl font-bold bg-gradient-to-r from-[#1f2a52] to-[#0f1226] bg-clip-text text-transparent drop-shadow">{formatTime(timeLeft)}</p>
                <p className="text-sm font-semibold text-[#2f9ad8] tracking-[0.2em] uppercase">In flow · Noise cancelled</p>
              </div>
              {showCelebration && (
                <div className="absolute inset-0 -z-10 select-none">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ffe4f7]/50 via-[#b2f5ea]/40 to-transparent blur-2xl opacity-80 animate-pulse" />
                  {[...Array(18)].map((_, index) => {
                    const angle = (index / 18) * 360;
                    const lineLength = 110;
                    const delay = (index % 6) * 80;
                    return (
                      <span
                        key={index}
                        className="absolute left-1/2 top-1/2 h-0.5 w-12 origin-left rounded-full bg-gradient-to-r from-white to-transparent"
                        style={{
                          transform: `rotate(${angle}deg) translateX(${radius / 2}px)`,
                          animation: `rayBurst 700ms ease-out ${delay}ms forwards`,
                        }}
                      />
                    );
                  })}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-white/70 bg-gradient-to-br from-white/70 to-transparent blur-sm shadow-[0_0_40px_rgba(255,255,255,0.8)]" />
                </div>
              )}
              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-white/70 via-cyan-200/40 to-purple-200/40 blur-3xl opacity-90" />
              {/* Lightning streak on timer */}
              <div
                className="pointer-events-none absolute -top-4 left-14 h-28 w-10 -rotate-6 rounded-full opacity-70 blur-lg mix-blend-screen"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(56,189,248,0.4) 60%, rgba(255,255,255,0) 100%)",
                  boxShadow: "0 0 35px rgba(56,189,248,0.5)",
                }}
              />
              <div
                className="pointer-events-none absolute top-6 right-12 h-24 w-24 opacity-70 blur-2xl mix-blend-screen"
                style={{
                  background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(56,189,248,0.4) 45%, rgba(255,255,255,0) 70%)",
                }}
              />
            </div>

            <div className="mt-8 grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-[#1f2548] shadow-[0_20px_45px_rgba(123,139,184,0.25)]">
                <div className="flex items-center gap-3">
                  <Coffee className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 p-2 text-[#825a08]" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f98be]">Next break</p>
                    <p className="text-lg font-semibold text-[#1f2548]">05:00</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#56608a]">Auto-start short break with ambient soundscape.</p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-[#1f2548] shadow-[0_20px_45px_rgba(123,139,184,0.25)]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-100 p-2 text-[#0f5132]" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f98be]">Streak</p>
                    <p className="text-lg font-semibold text-[#1f2548]">12 sessions</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#56608a]">Rewards unlocked · Keep momentum!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="pointer-events-none mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-gray-500">
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Mindful warmup
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <Zap className="h-4 w-4 text-cyan-400" />
          Smart interruptions
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
          <Flame className="h-4 w-4 text-rose-400" />
          Streak guardian
        </span>
      </div>
    </div>
  );
}
