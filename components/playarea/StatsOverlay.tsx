'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, Calendar, Clock, Target } from 'lucide-react';
import { ProjectStats, DailyStats } from './types';

interface StatsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  projectStats: ProjectStats;
  dailyStats: DailyStats;
}

export function StatsOverlay({ isOpen, onClose, projectStats, dailyStats }: StatsOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl bg-black/90 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-2xl transform transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Project Statistics</h2>
              <p className="text-sm text-white/60">Track your progress and achievements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Daily Stats */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-green-400" />
              <h3 className="text-lg font-medium text-white">Today's Progress</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{dailyStats.tasksCompleted}</div>
                <div className="text-sm text-white/60">Tasks Done</div>
                <div className="text-xs text-white/40 mt-1">Target: {dailyStats.targetTasks}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{dailyStats.sessionsCompleted}</div>
                <div className="text-sm text-white/60">Sessions</div>
                <div className="text-xs text-white/40 mt-1">Target: {dailyStats.targetSessions}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{formatHours(dailyStats.hoursWorked)}</div>
                <div className="text-sm text-white/60">Hours</div>
                <div className="text-xs text-white/40 mt-1">Target: {dailyStats.targetHours}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{dailyStats.breakSessions}</div>
                <div className="text-sm text-white/60">Breaks</div>
                <div className="text-xs text-white/40 mt-1">Rest periods</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">
                  {dailyStats.achieved ? 'Daily goals achieved! 🎉' : 'Keep going to reach your daily goals'}
                </span>
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-purple-400" />
              <h3 className="text-lg font-medium text-white">Overall Progress</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{projectStats.currentStreak}</div>
                <div className="text-sm text-white/60">Current Streak</div>
                <div className="text-xs text-white/40 mt-1">Days in a row</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{projectStats.longestStreak}</div>
                <div className="text-sm text-white/60">Best Streak</div>
                <div className="text-xs text-white/40 mt-1">Personal record</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{projectStats.totalTasksCompleted}</div>
                <div className="text-sm text-white/60">Total Tasks</div>
                <div className="text-xs text-white/40 mt-1">Completed</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{formatHours(projectStats.totalHoursWorked)}</div>
                <div className="text-sm text-white/60">Total Hours</div>
                <div className="text-xs text-white/40 mt-1">Worked</div>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Weekly Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-lg font-bold text-white">{projectStats.weeklyGoals.tasksPerWeek}</div>
                <div className="text-sm text-white/60">Tasks per week</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-lg font-bold text-white">{projectStats.weeklyGoals.sessionsPerWeek}</div>
                <div className="text-sm text-white/60">Sessions per week</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-lg font-bold text-white">{formatHours(projectStats.weeklyGoals.hoursPerWeek)}</div>
                <div className="text-sm text-white/60">Hours per week</div>
              </div>
            </div>
          </div>

          {projectStats.lastActiveDate && (
            <div className="text-center text-sm text-white/40">
              Last active: {formatDate(projectStats.lastActiveDate)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
