'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, PartyPopper, X, CalendarDays } from 'lucide-react';
import { FocusTrendChart } from './FocusTrendChart';
import { WeeklyBreakdownChart } from './WeeklyBreakdownChart';
import { WeeklyGoalsChart } from './WeeklyGoalsChart';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastActiveDate?: string | null;
}

const focusTrendData = [
  { day: 'Mon', minutes: 25 },
  { day: 'Tue', minutes: 45 },
  { day: 'Wed', minutes: 38 },
  { day: 'Thu', minutes: 52 },
  { day: 'Fri', minutes: 41 },
  { day: 'Sat', minutes: 29 },
  { day: 'Sun', minutes: 35 },
];

const weeklyBreakdownData = [
  { label: 'Focused', value: 85, color: '#10b981' },
  { label: 'Break', value: 10, color: '#fbbf24' },
  { label: 'Distracted', value: 5, color: '#ef4444' },
];

const weeklyGoalsData = [
  { label: 'Sessions', current: 32, target: 40, color: '#06b6d4' },
  { label: 'Hours', current: 15.5, target: 20, color: '#22d3ee' },
  { label: 'Tasks', current: 12, target: 15, color: '#10b981' },
];

type QuickStat = {
  label: string;
  value: string;
  subLabel?: string;
  comparison: string;
  change: string;
  changeTone: 'up' | 'down' | 'neutral';
  status: string;
  statusTone: 'positive' | 'neutral' | 'negative';
  progress?: number;
  accent: string;
};

const quickStats: QuickStat[] = [
  {
    label: 'Day streak',
    value: '5',
    comparison: 'Was: 3 days',
    change: '↑ +2 days (Better)',
    changeTone: 'up',
    status: 'Momentum rising',
    statusTone: 'positive',
    accent: 'from-emerald-500/30 to-emerald-500/10',
  },
  {
    label: 'Hours logged',
    value: '2.5h',
    subLabel: 'of 4.0h weekly',
    comparison: 'Last week: 2.2h',
    change: '↑ +0.3h (13% better)',
    changeTone: 'up',
    status: 'On track',
    statusTone: 'positive',
    progress: 0.625,
    accent: 'from-teal-500/30 to-teal-500/10',
  },
  {
    label: 'Focus sessions',
    value: '4',
    comparison: 'Last week: 3.2',
    change: '↑ +0.8 (25% more)',
    changeTone: 'up',
    status: 'Above average',
    statusTone: 'positive',
    accent: 'from-cyan-500/30 to-cyan-500/10',
  },
  {
    label: 'Task completion',
    value: '62.5%',
    comparison: 'Your avg: 75%',
    change: '↓ -12.5 points',
    changeTone: 'down',
    status: 'Below average',
    statusTone: 'negative',
    accent: 'from-red-500/20 to-red-500/5',
  },
];

type PresetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type SelectedPeriod = PresetPeriod | 'custom' | null;

const periodPresets: Record<PresetPeriod, { label: string; from: string; to: string }> = {
  daily: {
    label: 'Daily',
    from: '2026-01-02',
    to: '2026-01-02',
  },
  weekly: {
    label: 'Weekly',
    from: '2026-01-01',
    to: '2026-01-07',
  },
  monthly: {
    label: 'Monthly',
    from: '2026-01-01',
    to: '2026-01-31',
  },
  yearly: {
    label: 'Yearly',
    from: '2026-01-01',
    to: '2026-12-31',
  },
};
const presetOrder: PresetPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function StatsModal({ isOpen, onClose, lastActiveDate }: StatsModalProps) {
  const [celebrateMessage, setCelebrateMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>('weekly');
  const [customFrom, setCustomFrom] = useState(periodPresets.weekly.from);
  const [customTo, setCustomTo] = useState(periodPresets.weekly.to);
  const [lastAppliedRange, setLastAppliedRange] = useState<{ from: string; to: string }>({
    from: periodPresets.weekly.from,
    to: periodPresets.weekly.to,
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCelebrateMessage(null);
      setShowConfetti(false);
    }
  }, [isOpen]);

  const confettiPieces = useMemo(() => (
    Array.from({ length: 24 }).map((_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 0.6,
      color: ['#10b981', '#06b6d4', '#22d3ee', '#fbbf24', '#ef4444'][index % 5],
    }))
  ), []);

  const handleCelebrate = () => {
    setCelebrateMessage('You unlocked a new flow streak! Keep it glowing ✨');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
  };

  const handlePresetSelect = (period: PresetPeriod) => {
    setSelectedPeriod(period);
    setCustomFrom(periodPresets[period].from);
    setCustomTo(periodPresets[period].to);
    setLastAppliedRange({
      from: periodPresets[period].from,
      to: periodPresets[period].to,
    });
    setDatePickerOpen(false);
  };

  const handleApplyRange = () => {
    if (!customFrom || !customTo) return;
    setSelectedPeriod('custom');
    setLastAppliedRange({ from: customFrom, to: customTo });
    setDatePickerOpen(false);
  };

  const handleExport = () => {
    const rows = [
      ['Metric', 'Value'],
      ...quickStats.map((stat) => [stat.label, stat.value]),
      ['', ''],
      ['Weekly Goals', 'Current / Target'],
      ...weeklyGoalsData.map((goal) => [goal.label, `${goal.current} / ${goal.target}`]),
    ];
    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pomodro-stats.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formattedLastActive = lastActiveDate
    ? new Date(lastActiveDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Friday, January 2';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-[1000px] max-h-[90vh] overflow-hidden rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-[#0f172a]/95 via-[#0b1220]/90 to-[#031019]/95 p-1 shadow-[0_30px_120px_rgba(0,0,0,0.65)] flex flex-col"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
          >
            <div className="rounded-[30px] bg-[#050c18]/90 p-8 overflow-y-auto pr-3">
              <div className="flex flex-col gap-6">
                {/* Header with filters */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-[0.4em] text-emerald-300/80">Insights</p>
                    <div className="mt-2 flex items-center gap-3 text-white">
                      <span className="text-2xl">📊</span>
                      <div>
                        <h2 className="text-3xl font-semibold text-white">Your Focus Journey</h2>
                        <p className="text-sm text-white/60">Trendy, animated, and alive with your energy.</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
                      {weeklyGoalsData.map((goal) => {
                        const percentage = Math.round((goal.current / goal.target) * 100);
                        return (
                          <div
                            key={goal.label}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                          >
                            <p className="text-xs uppercase tracking-[0.3em] text-white/50">{goal.label}</p>
                            <p className="text-xl font-semibold text-white">
                              {goal.current}
                              <span className="text-sm text-white/50"> / {goal.target}</span>
                            </p>
                            <p className="text-emerald-300">{percentage}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/80">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="period-filter"
                          className="text-[10px] uppercase tracking-[0.25em] text-white/40"
                        >
                          Filter
                        </label>
                        <select
                          id="period-filter"
                          value={selectedPeriod && selectedPeriod !== 'custom' ? selectedPeriod : 'custom'}
                          onChange={(event) =>
                            handlePresetSelect((event.target.value as PresetPeriod) ?? 'daily')
                          }
                          className="rounded-md border border-white/20 bg-white/90 px-3 py-1 text-[12px] font-medium text-slate-800 outline-none transition focus:border-emerald-400"
                        >
                          {presetOrder.map((period) => (
                            <option key={period} value={period}>
                              {periodPresets[period].label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="h-5 w-px bg-white/20" />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDatePickerOpen((prev) => !prev)}
                          className="flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-medium text-white/80 transition hover:border-emerald-300 hover:text-white"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          {`${new Date(lastAppliedRange.from).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })} - ${new Date(lastAppliedRange.to).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}`}
                        </button>
                        <AnimatePresence>
                          {datePickerOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 z-10 mt-2 w-60 rounded-xl border border-white/10 bg-slate-900/95 p-3 text-[12px] text-white"
                            >
                              <div className="flex flex-col gap-2">
                                <label className="text-[11px] uppercase tracking-[0.25em] text-white/40">From</label>
                                <input
                                  type="date"
                                  value={customFrom}
                                  onChange={(event) => setCustomFrom(event.target.value)}
                                  className="rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-[12px] text-white outline-none transition focus:border-emerald-400 focus:bg-black/40"
                                />
                                <label className="text-[11px] uppercase tracking-[0.25em] text-white/40">To</label>
                                <input
                                  type="date"
                                  value={customTo}
                                  onChange={(event) => setCustomTo(event.target.value)}
                                  className="rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-[12px] text-white outline-none transition focus:border-emerald-400 focus:bg-black/40"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyRange}
                        className="rounded-md bg-emerald-500 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-emerald-600"
                      >
                        Apply
                      </button>
                    </div>
                    <button
                      onClick={onClose}
                      aria-label="Close stats modal"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-emerald-300/60 hover:bg-emerald-500/20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {quickStats.map((stat) => {
                    const changeColor =
                      stat.changeTone === 'up'
                        ? 'text-emerald-300'
                        : stat.changeTone === 'down'
                          ? 'text-rose-300'
                          : 'text-slate-300';
                    const statusColor =
                      stat.statusTone === 'positive'
                        ? 'text-emerald-200 bg-emerald-500/15 border-emerald-400/40'
                        : stat.statusTone === 'negative'
                          ? 'text-rose-200 bg-rose-500/15 border-rose-400/40'
                          : 'text-slate-200 bg-white/10 border-white/15';

                    return (
                      <motion.div
                        key={stat.label}
                        whileHover={{ y: -4 }}
                        className={`rounded-2xl border border-white/10 bg-gradient-to-br ${stat.accent} p-4 text-white`}
                      >
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                          <span>{stat.label}</span>
                          <span className="text-white/60">Current</span>
                        </div>
                        <div className="mt-2 flex items-end gap-2">
                          <p className="text-[28px] font-semibold leading-none">{stat.value}</p>
                          {stat.subLabel && <p className="text-xs text-white/70">{stat.subLabel}</p>}
                        </div>
                        <p className="mt-2 text-[12px] text-white/70">{stat.comparison}</p>
                        <p className={`text-[12px] font-medium ${changeColor}`}>{stat.change}</p>

                        {stat.progress !== undefined && (
                          <div className="mt-3">
                            <div className="h-2 w-full rounded-full bg-white/20">
                              <div
                                className="h-2 rounded-full bg-emerald-400 transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, stat.progress * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between text-[11px]">
                          <span
                            className={`rounded-full border px-2 py-1 ${statusColor}`}
                          >
                            {stat.status}
                          </span>
                          <span className="text-white/60 text-[11px]">vs previous</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

                {/* Graphs */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Trend</p>
                        <h3 className="text-lg font-semibold text-white">📈 Your Focus Trend</h3>
                      </div>
                      <span className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs text-emerald-300">7 days</span>
                    </div>
                    <div className="mt-3 flex-1">
                      <FocusTrendChart data={focusTrendData} />
                    </div>
                  </div>

                  <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">🥧 This Week's Breakdown</h3>
                    </div>
                    <div className="mt-2 flex-1">
                      <WeeklyBreakdownChart data={weeklyBreakdownData} />
                    </div>
                  </div>

                  <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">🎯 Weekly Goals</h3>
                    </div>
                    <div className="mt-2 flex-1">
                      <WeeklyGoalsChart data={weeklyGoalsData} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-4 border-t border-white/10 pt-4 text-white/70 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-sm">Last active: {formattedLastActive}</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-400/60 bg-cyan-500/10 px-5 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/20"
                      onClick={handleExport}
                    >
                      <Download className="h-4 w-4" />
                      Export Stats
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover-border-emerald-300 hover:bg-emerald-500/20"
                      onClick={handleCelebrate}
                    >
                      <PartyPopper className="h-4 w-4" />
                      Celebrate
                    </button>
                  </div>
                </div>

                {celebrateMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-base font-medium text-emerald-300"
                  >
                    {celebrateMessage}
                  </motion.p>
                )}
              </div>
            </div>

            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 z-[-1]">
                {confettiPieces.map((piece) => (
                  <span
                    key={piece.id}
                    className="absolute block h-2 w-1 rounded-sm"
                    style={{
                      left: `${piece.left}%`,
                      top: '-10%',
                      backgroundColor: piece.color,
                      animation: `stats-confetti ${piece.duration}s ease-out forwards`,
                      animationDelay: `${piece.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <style jsx global>{`
            @keyframes stats-confetti {
              0% {
                transform: translate3d(0,0,0) rotate(0deg);
                opacity: 1;
              }
              70% {
                opacity: 0.9;
              }
              100% {
                transform: translate3d(30px, 480px, 0) rotate(320deg);
                opacity: 0;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
