'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, PartyPopper, X, CalendarDays, TrendingUp, Target, Clock, Zap, Flame, Coffee, ListChecks, Clock3 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastActiveDate?: string | null;
  statsData?: {
    daily: any; // MergedStats
    weekly: any; // StatsData
    monthly: any; // StatsData
    yearly: any; // StatsData
  };
  projectStats?: {
    dailyGoals: {
      tasksPerDay: number;
      sessionsPerDay: number;
      hoursPerDay: number;
    };
    totalSessionsCompleted: number;
  };
  refreshStats?: () => void;
}

type DailyStat = {
  date: string;
  focused_alerts: number;
  deviated_alerts: number;
};

type PresetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type SelectedPeriod = PresetPeriod | 'custom';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to get date range
const getDateRange = (daysBack: number) => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - daysBack);
  return {
    from: from.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  };
};

// Helper function to get yearly range from user's first activity date
const getYearlyRange = (statsData: any) => {
  const today = getTodayDate();
  
  // Try to find the earliest date from daily stats
  if (statsData?.daily?.dailyArray && statsData.daily.dailyArray.length > 0) {
    const sortedDates = [...statsData.daily.dailyArray].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstDate = sortedDates[0].date;
    
    return {
      from: firstDate,
      to: today
    };
  }
  
  // Fallback to last 365 days if no data available
  return getDateRange(364);
};

const getPeriodPresets = (statsData?: any): Record<PresetPeriod, { label: string; from: string; to: string }> => ({
  daily: {
    label: 'Daily',
    from: getTodayDate(),
    to: getTodayDate(),
  },
  weekly: {
    label: 'Weekly',
    from: getDateRange(6).from,
    to: getDateRange(6).to,
  },
  monthly: {
    label: 'Monthly',
    from: getDateRange(29).from,
    to: getDateRange(29).to,
  },
  yearly: {
    label: 'Yearly',
    from: getYearlyRange(statsData).from,
    to: getYearlyRange(statsData).to,
  },
});

const presetOrder: PresetPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function StatsModal({ isOpen, onClose, lastActiveDate, statsData, projectStats, refreshStats }: StatsModalProps) {
  const [celebrateMessage, setCelebrateMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>('weekly');
  
  // Get dynamic period presets based on statsData
  const periodPresets = useMemo(() => getPeriodPresets(statsData), [statsData]);
  
  const [customFrom, setCustomFrom] = useState(() => getDateRange(6).from);
  const [customTo, setCustomTo] = useState(() => getDateRange(6).to);
  const [lastAppliedRange, setLastAppliedRange] = useState<{ from: string; to: string }>(() => ({
    from: getDateRange(6).from,
    to: getDateRange(6).to,
  }));
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCelebrateMessage(null);
      setShowConfetti(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && refreshStats) {
      refreshStats();
    }
  }, [isOpen, refreshStats]);

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
      ['Tasks Completed', currentStats?.tasksCompleted || 12],
      ['Focus Sessions', currentStats?.focusSessions || 8],
      ['Total Focus Time', `${(currentStats?.completedHours * 60)?.toFixed(0) || '0'}m`],
      ['Break Count', currentStats?.breakSessions || 6],
      ['Longest Streak', currentStats?.longestStreak || 5],
      ['Planned Hours', `${(currentStats?.plannedHours * 60)?.toFixed(0) || '0'}m`],
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

  const handleCelebrate = () => {
    setCelebrateMessage('You unlocked a new flow streak! Keep it glowing ✨');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
  };

  const formattedLastActive = lastActiveDate
    ? new Date(lastActiveDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Friday, January 2';

  const currentStats = statsData && selectedPeriod && selectedPeriod !== 'custom' ? statsData[selectedPeriod] : null;

  const statsCards = useMemo(() => [
    {
      label: 'Tasks Completed',
      value: currentStats?.tasksCompleted?.toString() || '0',
      subLabel: 'All time achievements',
      progress: currentStats && projectStats ? Math.min(100, (currentStats.tasksCompleted / projectStats.dailyGoals.tasksPerDay) * 100) : 0,
      accent: 'from-emerald-500/30 to-emerald-500/10',
      icon: ListChecks,
      color: 'text-emerald-300',
    },
    {
      label: 'Focus Sessions',
      value: currentStats?.focusSessions?.toString() || '0',
      subLabel: 'Pomodoros completed',
      change: selectedPeriod === 'weekly' && currentStats?.focusSessions ? `+${currentStats.focusSessions} this week` : undefined,
      progress: currentStats && projectStats && projectStats.totalSessionsCompleted > 0 ? Math.min(100, (currentStats.focusSessions / projectStats.totalSessionsCompleted) * 100) : 0,
      accent: 'from-cyan-500/30 to-cyan-500/10',
      icon: Zap,
      color: 'text-cyan-300',
    },
    {
      label: 'Total Focus Time',
      value: `${(currentStats?.completedHours * 60)?.toFixed(0) || '0'}m`,
      subLabel: 'Deep work invested',
      progress: currentStats && currentStats.plannedHours > 0 ? Math.min(100, (currentStats.completedHours / currentStats.plannedHours) * 100) : 0,
      accent: 'from-blue-500/30 to-blue-500/10',
      icon: Clock3,
      color: 'text-blue-300',
    },
    {
      label: 'Break Count',
      value: currentStats?.breakSessions?.toString() || '0',
      subLabel: 'Rest periods',
      status: 'Balanced',
      accent: 'from-orange-500/30 to-orange-500/10',
      icon: Coffee,
      color: 'text-orange-300',
    },
    {
      label: 'Longest Streak',
      value: currentStats?.longestStreak?.toString() || '0',
      subLabel: 'Personal best',
      changeComponent: (() => {
        // Calculate total days travelled and missed days
        const dailyArray = (statsData?.daily?.dailyArray || []) as any[];
        const totalDays = dailyArray.length;
        const activeDays = currentStats?.longestStreak || 0;
        const missedDays = totalDays - activeDays;
        
        return (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/70">Total: {totalDays} days</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" transform="rotate(180 10 10)" />
              </svg>
              <span className="text-emerald-400">{activeDays}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400">{missedDays}</span>
            </div>
          </div>
        );
      })(),
      accent: 'from-red-500/30 to-red-500/10',
      icon: Flame,
      color: 'text-red-300',
    },
    {
      label: 'Planned Hours',
      value: `${(currentStats?.plannedHours * 60)?.toFixed(0) || '0'}m`,
      subLabel: 'Time allocated',
      progress: currentStats && currentStats.plannedHours > 0 ? Math.min(100, (currentStats.completedHours / currentStats.plannedHours) * 100) : 0,
      accent: 'from-violet-500/30 to-violet-500/10',
      icon: Clock,
      color: 'text-violet-300',
    },
  ], [currentStats, selectedPeriod, projectStats]);

  const confettiPieces = useMemo(() => (
    Array.from({ length: 24 }).map((_, index) => ({
      id: index,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 0.6,
      color: ['#10b981', '#06b6d4', '#22d3ee', '#fbbf24', '#ef4444'][index % 5],
    }))
  ), []);

  // Calculate pie chart data from statsData
  const pieChartData = useMemo(() => {
    // Extract time values from statsData (in minutes)
    const focusTimeMinutes = currentStats?.focus_time || 0;
    const breakTimeMinutes = currentStats?.break_time || 0;
    const deviationTimeMinutes = currentStats?.deviation_time || 0;
    
    // Calculate total time
    const totalMinutes = focusTimeMinutes + breakTimeMinutes + deviationTimeMinutes;
    
    // Calculate percentages (fallback to equal distribution if no data)
    const focusPercent = totalMinutes > 0 ? (focusTimeMinutes / totalMinutes) * 100 : 33.33;
    const breakPercent = totalMinutes > 0 ? (breakTimeMinutes / totalMinutes) * 100 : 33.33;
    const deviationPercent = totalMinutes > 0 ? (deviationTimeMinutes / totalMinutes) * 100 : 33.33;
    
    // Helper function to format time as "X hr Y mins"
    const formatTime = (minutes: number): string => {
      if (minutes === 0) return '0 mins';
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      
      if (hours === 0) return `${mins} mins`;
      if (mins === 0) return `${hours} hr`;
      return `${hours} hr ${mins} mins`;
    };
    
    // Convert minutes to readable format
    const focusTime = formatTime(focusTimeMinutes);
    const breakTime = formatTime(breakTimeMinutes);
    const deviationTime = formatTime(deviationTimeMinutes);
    
    // Calculate SVG path coordinates for pie chart
    const centerX = 60;
    const centerY = 60;
    const radius = 48;
    
    // Helper function to calculate point on circle
    const polarToCartesian = (angle: number) => {
      const rad = (angle - 90) * Math.PI / 180;
      return {
        x: centerX + radius * Math.cos(rad),
        y: centerY + radius * Math.sin(rad)
      };
    };
    
    // Calculate angles for each segment
    const focusAngle = (focusPercent / 100) * 360;
    const breakAngle = (breakPercent / 100) * 360;
    const deviationAngle = (deviationPercent / 100) * 360;
    
    // Calculate end points for each segment
    const focusEnd = polarToCartesian(focusAngle);
    const breakEnd = polarToCartesian(focusAngle + breakAngle);
    
    // Determine if arc should be large (> 180 degrees)
    const focusLargeArc = focusAngle > 180 ? 1 : 0;
    const breakLargeArc = breakAngle > 180 ? 1 : 0;
    const deviationLargeArc = deviationAngle > 180 ? 1 : 0;
    
    // Build SVG path strings
    const focusPath = `M${centerX} ${centerY} L${centerX} ${centerY - radius} A${radius} ${radius} 0 ${focusLargeArc} 1 ${focusEnd.x} ${focusEnd.y} Z`;
    const breakPath = `M${centerX} ${centerY} L${focusEnd.x} ${focusEnd.y} A${radius} ${radius} 0 ${breakLargeArc} 1 ${breakEnd.x} ${breakEnd.y} Z`;
    const deviationPath = `M${centerX} ${centerY} L${breakEnd.x} ${breakEnd.y} A${radius} ${radius} 0 ${deviationLargeArc} 1 ${centerX} ${centerY - radius} Z`;
    
    return {
      focusPercent,
      breakPercent,
      deviationPercent,
      focusTime,
      breakTime,
      deviationTime,
      focusPath,
      breakPath,
      deviationPath
    };
  }, [currentStats]);

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
            className="relative z-10 w-full max-w-[1200px] max-h-[90vh] overflow-hidden rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-[#0f172a]/95 via-[#0b1220]/90 to-[#031019]/95 p-1 shadow-[0_30px_120px_rgba(0,0,0,0.65)] flex flex-col"
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
                        <p className="text-sm text-white/60">Track your productivity and achievements</p>
                      </div>
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

                {/* 6 Stats Cards Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {statsCards.map((stat) => {
                    const IconComponent = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        whileHover={{ y: -4 }}
                        className={`rounded-2xl border border-white/10 bg-gradient-to-br ${stat.accent} p-4 text-white`}
                      >
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                          <span className="flex items-center gap-2">
                            <IconComponent className={`h-4 w-4 ${stat.color}`} />
                            {stat.label}
                          </span>
                          <span className="text-white/60">Current</span>
                        </div>
                        <div className="mt-2 flex items-end gap-2">
                          <p className="text-[28px] font-semibold leading-none">{stat.value}</p>
                          {stat.subLabel && <p className="text-xs text-white/70">{stat.subLabel}</p>}
                        </div>
                        {stat.progress !== undefined && (
                          <div className="mt-3">
                            <div className="h-2 w-full rounded-full bg-white/20">
                              <div
                                className="h-2 rounded-full bg-emerald-400 transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, stat.progress))}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {stat.change && (
                          <p className={`mt-2 text-[12px] font-medium ${stat.color}`}>{stat.change}</p>
                        )}
                        {stat.changeComponent && (
                          <div className="mt-2">
                            {stat.changeComponent}
                          </div>
                        )}
                        {stat.status && (
                          <div className="mt-3 flex items-center justify-between text-[11px]">
                            <span className={`rounded-full border px-2 py-1 text-emerald-200 bg-emerald-500/15 border-emerald-400/40`}>
                              {stat.status}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Timeline</p>
                        <h3 className="text-lg font-semibold text-white">Daily Focus vs Deviation</h3>
                      </div>
                      <span className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs text-emerald-300">
                        {selectedPeriod === 'daily' ? 'Today' : selectedPeriod === 'weekly' ? '7 days' : selectedPeriod === 'monthly' ? '30 days' : 'Period'}
                      </span>
                    </div>
                    <div className="mt-3 flex-1">
                      {/* Enhanced Daily Focus vs Deviation Chart */}
                      <div className="h-full flex flex-col justify-center">
                        {/* Y-axis labels */}
                        <div className="flex items-end mb-2 h-32">
                          <div className="flex flex-col justify-between text-xs text-white/40 h-full pr-2">
                            {(() => {
                                const dailyArray = (statsData?.daily?.dailyArray || []) as DailyStat[];
                                const chartData = dailyArray.slice(-7).reverse().map((d) => ({
                                day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                                focused: d.focused_alerts || 0,
                                deviated: d.deviated_alerts || 0,
                              }));

                              const allValues = chartData.flatMap(d => [d.focused, d.deviated]);
                              const globalMaxValue = Math.max(...allValues, 5);
                              const yLabels = [5, 4, 3, 2, 1, 0].map(i => Math.round((globalMaxValue / 5) * i));

                              return yLabels.map((label: number, i: number) => (
                                <span key={i}>{label}</span>
                              ));
                            })()}
                          </div>
                          
                          {/* Grid lines */}
                          <div className="flex-1 relative">
                            <div className="absolute inset-0 grid grid-rows-5 gap-0">
                              {[0,1,2,3,4].map(i => (
                                <div key={i} className="border-t border-white/5 h-full"></div>
                              ))}
                            </div>
                            
                            {/* Chart bars */}
                            <div className="relative grid grid-cols-7 gap-2 h-full">
                              {(() => {
                                const dailyArray = (statsData?.daily?.dailyArray || []) as DailyStat[];
                                const chartData = dailyArray.slice(-7).reverse().map((d) => ({
                                  day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                                  focused: d.focused_alerts || 0,
                                  deviated: d.deviated_alerts || 0,
                                }));

                                // Calculate max value across all days for consistent scaling
                                const allValues = chartData.flatMap(d => [d.focused, d.deviated]);
                                const globalMaxValue = Math.max(...allValues, 5);

                                return chartData.map((dayData: { day: string; focused: number; deviated: number }, dayIndex: number) => {
                                  
                                  return (
                                    <motion.div 
                                      key={dayData.day} 
                                      className="flex flex-col items-center gap-1 group cursor-pointer"
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: dayIndex * 0.1, duration: 0.5 }}
                                      whileHover={{ scale: 1.05 }}
                                    >
                                      {/* Bars container */}
                                      <div className="relative h-32 flex flex-col-reverse gap-0.5">
                                        {/* Focused bar */}
                                        <motion.div
                                          className="rounded-sm overflow-hidden shadow-lg bg-gradient-to-t from-emerald-600 to-emerald-500"
                                          style={{ 
                                            height: globalMaxValue > 0 ? `${Math.max((dayData.focused / globalMaxValue) * 120, dayData.focused > 0 ? 8 : 0)}px` : '0px',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                            minWidth: '12px'
                                          }}
                                          initial={{ scaleY: 0 }}
                                          animate={{ scaleY: 1 }}
                                          transition={{ delay: dayIndex * 0.1 + 0.1, duration: 0.6, ease: "easeOut" }}
                                          title={`${dayData.day} Focused: ${dayData.focused}`}
                                        >
                                          <div className="w-full h-full bg-gradient-to-t from-emerald-700 to-transparent"></div>
                                        </motion.div>
                                        
                                        {/* Deviated bar */}
                                        <motion.div
                                          className="rounded-sm overflow-hidden shadow-lg bg-gradient-to-t from-red-600 to-red-500"
                                          style={{ 
                                            height: globalMaxValue > 0 ? `${Math.max((dayData.deviated / globalMaxValue) * 120, dayData.deviated > 0 ? 8 : 0)}px` : '0px',
                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                            minWidth: '12px'
                                          }}
                                          initial={{ scaleY: 0 }}
                                          animate={{ scaleY: 1 }}
                                          transition={{ delay: dayIndex * 0.1 + 0.2, duration: 0.6, ease: "easeOut" }}
                                          title={`${dayData.day} Deviated: ${dayData.deviated}`}
                                        >
                                          <div className="w-full h-full bg-gradient-to-t from-red-700 to-transparent"></div>
                                        </motion.div>
                                      </div>
                                      
                                      {/* Day label */}
                                      <span className="text-xs text-white/60 group-hover:text-white transition-colors font-medium">
                                        {dayData.day}
                                      </span>
                                    </motion.div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced legend */}
                        <div className="flex justify-center gap-6 mt-2">
                          <motion.div 
                            className="flex items-center gap-2 group"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded shadow-lg"></div>
                            <span className="text-xs text-white/70 group-hover:text-white transition-colors font-medium">
                              Focus Time
                            </span>
                          </motion.div>
                          <motion.div 
                            className="flex items-center gap-2 group"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded shadow-lg"></div>
                            <span className="text-xs text-white/70 group-hover:text-white transition-colors font-medium">
                              Deviation
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Focus Distribution</h3>
                    </div>
                    <div className="mt-2 flex-1 flex flex-col items-center justify-center">
                      {/* 3D Enhanced Focus Distribution Pie Chart */}
                      <div className="relative w-48 h-48 group">
                        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
                          {/* 3D Shadow/Base */}
                          <defs>
                            <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" style={{stopColor:'rgba(0,0,0,0.3)', stopOpacity:1}} />
                              <stop offset="70%" style={{stopColor:'rgba(0,0,0,0.1)', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'rgba(0,0,0,0)', stopOpacity:0}} />
                            </radialGradient>
                            
                            {/* Focus segment gradient with 3D effect */}
                            <radialGradient id="focus3DGradient" cx="30%" cy="30%" r="70%">
                              <stop offset="0%" style={{stopColor:'#10b981', stopOpacity:1}} />
                              <stop offset="40%" style={{stopColor:'#059669', stopOpacity:1}} />
                              <stop offset="70%" style={{stopColor:'#047857', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'#065f46', stopOpacity:1}} />
                            </radialGradient>
                            <linearGradient id="focusHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{stopColor:'rgba(255,255,255,0.3)', stopOpacity:1}} />
                              <stop offset="50%" style={{stopColor:'rgba(255,255,255,0.1)', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'rgba(255,255,255,0)', stopOpacity:0}} />
                            </linearGradient>
                            
                            {/* Break segment gradient */}
                            <radialGradient id="break3DGradient" cx="70%" cy="30%" r="70%">
                              <stop offset="0%" style={{stopColor:'#fbbf24', stopOpacity:1}} />
                              <stop offset="40%" style={{stopColor:'#d97706', stopOpacity:1}} />
                              <stop offset="70%" style={{stopColor:'#b45309', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'#92400e', stopOpacity:1}} />
                            </radialGradient>
                            <linearGradient id="breakHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{stopColor:'rgba(255,255,255,0.4)', stopOpacity:1}} />
                              <stop offset="50%" style={{stopColor:'rgba(255,255,255,0.1)', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'rgba(255,255,255,0)', stopOpacity:0}} />
                            </linearGradient>
                            
                            {/* Deviation segment gradient */}
                            <radialGradient id="deviation3DGradient" cx="50%" cy="70%" r="70%">
                              <stop offset="0%" style={{stopColor:'#ef4444', stopOpacity:1}} />
                              <stop offset="40%" style={{stopColor:'#dc2626', stopOpacity:1}} />
                              <stop offset="70%" style={{stopColor:'#b91c1c', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'#991b1b', stopOpacity:1}} />
                            </radialGradient>
                            <linearGradient id="deviationHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" style={{stopColor:'rgba(255,255,255,0.2)', stopOpacity:1}} />
                              <stop offset="50%" style={{stopColor:'rgba(255,255,255,0.05)', stopOpacity:1}} />
                              <stop offset="100%" style={{stopColor:'rgba(255,255,255,0)', stopOpacity:0}} />
                            </linearGradient>
                            
                            <filter id="pie3DGlow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge> 
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          
                          {/* 3D Shadow base */}
                          <ellipse cx="60" cy="115" rx="45" ry="8" fill="url(#shadowGradient)" opacity="0.6" />
                          
                          {/* Background circle with 3D border */}
                          <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                          <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          
                          {/* Focus segment - 3D extruded */}
                          <motion.g 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                          >
                            {/* Main segment */}
                            <motion.path 
                              d={pieChartData.focusPath} 
                              fill="url(#focus3DGradient)"
                              stroke="#10b981"
                              strokeWidth="1.5"
                              filter="url(#pie3DGlow)"
                              className="cursor-pointer transition-all hover:stroke-2"
                              whileHover={{ scale: 1.02 }}
                            />
                            {/* Highlight overlay */}
                            <path 
                              d={pieChartData.focusPath} 
                              fill="url(#focusHighlight)"
                              opacity="0.6"
                            />
                            {/* 3D depth lines */}
                            <path d="M60 12 L60 10 M104.88 60 L106.88 60" stroke="rgba(16,185,129,0.3)" strokeWidth="0.5"/>
                          </motion.g>
                          
                          {/* Break segment - 3D extruded */}
                          <motion.g 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                          >
                            {/* Main segment */}
                            <motion.path 
                              d={pieChartData.breakPath} 
                              fill="url(#break3DGradient)"
                              stroke="#fbbf24"
                              strokeWidth="1.5"
                              filter="url(#pie3DGlow)"
                              className="cursor-pointer transition-all hover:stroke-2"
                              whileHover={{ scale: 1.02 }}
                            />
                            {/* Highlight overlay */}
                            <path 
                              d={pieChartData.breakPath} 
                              fill="url(#breakHighlight)"
                              opacity="0.7"
                            />
                            {/* 3D depth lines */}
                            <path d="M104.88 60 L106.88 60 M95.12 104.88 L95.12 106.88" stroke="rgba(251,191,36,0.3)" strokeWidth="0.5"/>
                          </motion.g>
                          
                          {/* Deviation segment - 3D extruded */}
                          <motion.g 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                          >
                            {/* Main segment */}
                            <motion.path 
                              d={pieChartData.deviationPath} 
                              fill="url(#deviation3DGradient)"
                              stroke="#ef4444"
                              strokeWidth="1.5"
                              filter="url(#pie3DGlow)"
                              className="cursor-pointer transition-all hover:stroke-2"
                              whileHover={{ scale: 1.02 }}
                            />
                            {/* Highlight overlay */}
                            <path 
                              d={pieChartData.deviationPath} 
                              fill="url(#deviationHighlight)"
                              opacity="0.5"
                            />
                            {/* 3D depth lines */}
                            <path d="M95.12 104.88 L95.12 106.88 M60 108 L60 110" stroke="rgba(239,68,68,0.3)" strokeWidth="0.5"/>
                          </motion.g>
                        </svg>
                        
                        {/* Enhanced 3D center label */}
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                          <motion.div 
                            className="text-center bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md rounded-full w-20 h-20 flex items-center justify-center border-2 border-white/20 shadow-2xl"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            style={{
                              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 8px 16px rgba(0,0,0,0.3)'
                            }}
                          >
                            <div>
                              <div className="text-2xl font-bold text-white drop-shadow-lg">{Math.round(pieChartData.focusPercent)}%</div>
                              <div className="text-xs text-white/80 font-medium">Focused</div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                      
                      {/* Enhanced 3D legend */}
                      <div className="mt-8 space-y-4 w-full max-w-sm">
                        <motion.div 
                          className="flex items-center justify-between text-sm group hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-emerald-500/5 p-3 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/20"
                          whileHover={{ scale: 1.02 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg border-2 border-emerald-400/50"></div>
                            <span className="text-white/95 group-hover:text-white transition-colors font-semibold">Focus Time</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-lg">{pieChartData.focusTime}</span>
                            <span className="text-white/70 ml-2 font-medium">({Math.round(pieChartData.focusPercent)}%)</span>
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex items-center justify-between text-sm group hover:bg-gradient-to-r hover:from-yellow-500/10 hover:to-yellow-500/5 p-3 rounded-xl transition-all cursor-pointer border border-transparent hover:border-yellow-500/20"
                          whileHover={{ scale: 1.02 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-lg border-2 border-yellow-400/50"></div>
                            <span className="text-white/95 group-hover:text-white transition-colors font-semibold">Break Time</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-lg">{pieChartData.breakTime}</span>
                            <span className="text-white/70 ml-2 font-medium">({Math.round(pieChartData.breakPercent)}%)</span>
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex items-center justify-between text-sm group hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-500/5 p-3 rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/20"
                          whileHover={{ scale: 1.02 }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg border-2 border-red-400/50"></div>
                            <span className="text-white/95 group-hover:text-white transition-colors font-semibold">Deviation</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-lg">{pieChartData.deviationTime}</span>
                            <span className="text-white/70 ml-2 font-medium">({Math.round(pieChartData.deviationPercent)}%)</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Overall Performance</h3>
                    </div>
                    <div className="mt-2 flex-1 flex items-center justify-center">
                      {/* Overall Improvement Indicator */}
                      {(() => {
                        // Calculate overall performance score
                        const tasksScore = currentStats && projectStats ? Math.min(100, (currentStats.tasksCompleted / projectStats.dailyGoals.tasksPerDay) * 100) : 0;
                        const hoursScore = currentStats && projectStats ? Math.min(100, (currentStats.completedHours / projectStats.dailyGoals.hoursPerDay) * 100) : 0;
                        const sessionsScore = currentStats && projectStats ? Math.min(100, (currentStats.focusSessions / projectStats.dailyGoals.sessionsPerDay) * 100) : 0;
                        
                        const overallScore = (tasksScore + hoursScore + sessionsScore) / 3;
                        
                        // Determine status and message
                        let status, message, icon, color, bgColor, glowColor;
                        
                        if (overallScore >= 90) {
                          status = 'Excellent';
                          message = 'Outstanding performance! Keep it up! 🌟';
                          icon = '🚀';
                          color = 'text-emerald-400';
                          bgColor = 'from-emerald-500/30 to-emerald-500/10';
                          glowColor = 'bg-emerald-500/30';
                        } else if (overallScore >= 75) {
                          status = 'Great Progress';
                          message = 'Nice improvement! You\'re doing well! 💪';
                          icon = '✨';
                          color = 'text-cyan-400';
                          bgColor = 'from-cyan-500/30 to-cyan-500/10';
                          glowColor = 'bg-cyan-500/30';
                        } else if (overallScore >= 60) {
                          status = 'Good Effort';
                          message = 'Making progress! Keep pushing forward! 👍';
                          icon = '📈';
                          color = 'text-blue-400';
                          bgColor = 'from-blue-500/30 to-blue-500/10';
                          glowColor = 'bg-blue-500/30';
                        } else if (overallScore >= 40) {
                          status = 'Room to Grow';
                          message = 'Yet to improve. You can do better! 💡';
                          icon = '🎯';
                          color = 'text-yellow-400';
                          bgColor = 'from-yellow-500/30 to-yellow-500/10';
                          glowColor = 'bg-yellow-500/30';
                        } else {
                          status = 'Needs Attention';
                          message = 'Time to step up! Let\'s get back on track! 🔥';
                          icon = '⚡';
                          color = 'text-orange-400';
                          bgColor = 'from-orange-500/30 to-orange-500/10';
                          glowColor = 'bg-orange-500/30';
                        }
                        
                        return (
                          <div className="w-full flex flex-col items-center justify-center gap-6">
                            {/* Animated Icon with Glow */}
                            <motion.div
                              className="relative"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                              <div className={`absolute inset-0 ${glowColor} blur-2xl scale-150 animate-pulse`}></div>
                              <motion.div
                                className="relative text-6xl"
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatType: "reverse"
                                }}
                              >
                                {icon}
                              </motion.div>
                            </motion.div>
                            
                            {/* Score Display */}
                            <motion.div
                              className="text-center"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3, duration: 0.6 }}
                            >
                              <motion.div
                                className={`text-5xl font-bold ${color} drop-shadow-lg`}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                {Math.round(overallScore)}%
                              </motion.div>
                              <div className="text-xl font-semibold text-white mt-2">
                                {status}
                              </div>
                            </motion.div>
                            
                            {/* Message with Animation */}
                            <motion.div
                              className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${bgColor} border border-white/10 backdrop-blur`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5, duration: 0.6 }}
                            >
                              <p className="text-sm text-white/90 text-center font-medium">
                                {message}
                              </p>
                            </motion.div>
                            
                            {/* Breakdown Stats */}
                            <motion.div
                              className="grid grid-cols-3 gap-4 w-full mt-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.7, duration: 0.6 }}
                            >
                              <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-xs text-white/60">Tasks</div>
                                <div className={`text-lg font-bold ${tasksScore >= 80 ? 'text-emerald-400' : tasksScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {Math.round(tasksScore)}%
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-xs text-white/60">Hours</div>
                                <div className={`text-lg font-bold ${hoursScore >= 80 ? 'text-emerald-400' : hoursScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {Math.round(hoursScore)}%
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-xs text-white/60">Sessions</div>
                                <div className={`text-lg font-bold ${sessionsScore >= 80 ? 'text-emerald-400' : sessionsScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {Math.round(sessionsScore)}%
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })()}
                      <div className="grid grid-cols-1 gap-8" style={{ display: 'none' }}>
                        {/* Tasks Progress */}
                        <motion.div 
                          className="flex flex-col items-center gap-3 group cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.6 }}
                        >
                          <div className="relative w-20 h-20">
                            {/* Glow effect background */}
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-150 animate-pulse"></div>
                            
                            <svg className="w-full h-full relative z-10" viewBox="0 0 40 40">
                              <defs>
                                <linearGradient id="tasksGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{stopColor:'#10b981', stopOpacity:1}} />
                                  <stop offset="100%" style={{stopColor:'#059669', stopOpacity:1}} />
                                </linearGradient>
                                <filter id="radialGlow">
                                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                  <feMerge> 
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                                </filter>
                              </defs>
                              
                              {/* Background circle */}
                              <circle
                                cx="20" cy="20" r="16"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="3"
                                className="drop-shadow-sm"
                              />
                              
                              {/* Progress circle with gradient */}
                              <motion.circle
                                cx="20" cy="20" r="16"
                                fill="none"
                                stroke="url(#tasksGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${((currentStats?.tasksCompleted || 0) / (projectStats?.dailyGoals?.tasksPerDay || 15)) * 100}, 100`}
                                filter="url(#radialGlow)"
                                className="drop-shadow-lg"
                                initial={{ strokeDasharray: '0, 100' }}
                                animate={{ strokeDasharray: `${((currentStats?.tasksCompleted || 0) / (projectStats?.dailyGoals?.tasksPerDay || 15)) * 100}, 100` }}
                                transition={{ delay: 0.4, duration: 1.5, ease: "easeOut" }}
                              />
                            </svg>
                            
                            {/* Center content */}
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <motion.div 
                                className="text-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                              >
                                <div className="text-lg font-bold text-white drop-shadow-lg group-hover:text-emerald-300 transition-colors">
                                  {Math.round(((currentStats?.tasksCompleted || 0) / (projectStats?.dailyGoals?.tasksPerDay || 15)) * 100)}%
                                </div>
                                <div className="text-xs text-white/70 group-hover:text-emerald-200 transition-colors">
                                  Tasks
                                </div>
                              </motion.div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-white/70 group-hover:text-white transition-colors">{`${currentStats?.tasksCompleted || 0}/${projectStats?.dailyGoals?.tasksPerDay || 15} completed`}</p>
                          </div>
                        </motion.div>

                        {/* Hours Progress */}
                        <motion.div 
                          className="flex flex-col items-center gap-3 group cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4, duration: 0.6 }}
                        >
                          <div className="relative w-20 h-20">
                            {/* Glow effect background */}
                            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl scale-150 animate-pulse"></div>
                            
                            <svg className="w-full h-full relative z-10" viewBox="0 0 40 40">
                              <defs>
                                <linearGradient id="hoursGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{stopColor:'#06b6d4', stopOpacity:1}} />
                                  <stop offset="100%" style={{stopColor:'#0891b2', stopOpacity:1}} />
                                </linearGradient>
                              </defs>
                              
                              {/* Background circle */}
                              <circle
                                cx="20" cy="20" r="16"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="3"
                                className="drop-shadow-sm"
                              />
                              
                              {/* Progress circle */}
                              <motion.circle
                                cx="20" cy="20" r="16"
                                fill="none"
                                stroke="url(#hoursGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${((currentStats?.completedHours || 0) / (projectStats?.dailyGoals?.hoursPerDay || 20)) * 100}, 100`}
                                filter="url(#radialGlow)"
                                className="drop-shadow-lg"
                                initial={{ strokeDasharray: '0, 100' }}
                                animate={{ strokeDasharray: `${((currentStats?.completedHours || 0) / (projectStats?.dailyGoals?.hoursPerDay || 20)) * 100}, 100` }}
                                transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
                              />
                            </svg>
                            
                            {/* Center content */}
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <motion.div 
                                className="text-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                              >
                                <div className="text-lg font-bold text-white drop-shadow-lg group-hover:text-cyan-300 transition-colors">
                                  {Math.round(((currentStats?.completedHours || 0) / (projectStats?.dailyGoals?.hoursPerDay || 20)) * 100)}%
                                </div>
                                <div className="text-xs text-white/70 group-hover:text-cyan-200 transition-colors">
                                  Hours
                                </div>
                              </motion.div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-white/70 group-hover:text-white transition-colors">{`${(currentStats?.completedHours || 0).toFixed(1)}/${projectStats?.dailyGoals?.hoursPerDay || 20} hours`}</p>
                          </div>
                        </motion.div>

                        {/* Sessions Progress */}
                        <motion.div 
                          className="flex flex-col items-center gap-3 group cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.6 }}
                        >
                          <div className="relative w-20 h-20">
                            {/* Glow effect background */}
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl scale-150 animate-pulse"></div>
                            
                            <svg className="w-full h-full relative z-10" viewBox="0 0 40 40">
                              <defs>
                                <linearGradient id="sessionsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{stopColor:'#22d3ee', stopOpacity:1}} />
                                  <stop offset="100%" style={{stopColor:'#0891b2', stopOpacity:1}} />
                                </linearGradient>
                              </defs>
                              
                              {/* Background circle */}
                              <circle
                                cx="20" cy="20" r="16"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="3"
                                className="drop-shadow-sm"
                              />
                              
                              {/* Progress circle */}
                              <motion.circle
                                cx="20" cy="20" r="16"
                                fill="none"
                                stroke="url(#sessionsGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${((currentStats?.focusSessions || 0) / (projectStats?.dailyGoals?.sessionsPerDay || 40)) * 100}, 100`}
                                filter="url(#radialGlow)"
                                className="drop-shadow-lg"
                                initial={{ strokeDasharray: '0, 100' }}
                                animate={{ strokeDasharray: `${((currentStats?.focusSessions || 0) / (projectStats?.dailyGoals?.sessionsPerDay || 40)) * 100}, 100` }}
                                transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                              />
                            </svg>
                            
                            {/* Center content */}
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <motion.div 
                                className="text-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1.0, duration: 0.5 }}
                              >
                                <div className="text-lg font-bold text-white drop-shadow-lg group-hover:text-blue-300 transition-colors">
                                  {Math.round(((currentStats?.focusSessions || 0) / (projectStats?.dailyGoals?.sessionsPerDay || 40)) * 100)}%
                                </div>
                                <div className="text-xs text-white/70 group-hover:text-blue-200 transition-colors">
                                  Sessions
                                </div>
                              </motion.div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-white/70 group-hover:text-white transition-colors">{`${currentStats?.focusSessions || 0}/${projectStats?.dailyGoals?.sessionsPerDay || 40} sessions`}</p>
                          </div>
                        </motion.div>
                      </div>
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
