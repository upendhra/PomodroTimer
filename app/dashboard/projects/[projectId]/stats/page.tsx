'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatsModal } from '@/components/playarea/stats/StatsModal';
import { useLocalStats } from '@/hooks/useLocalStats';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

interface StatsData {
  tasksCompleted: number;
  focusSessions: number;
  breakSessions: number;
  currentStreak: number;
  longestStreak: number;
  plannedHours: number;
  completedHours: number;
  totalSessionTime: number;
  date?: string;
}

interface MergedStats extends StatsData {
  projectId: string;
  date: string;
}

export default function StatsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [dailyStats, setDailyStats] = useState<MergedStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<StatsData | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { mergeWithSupabase, syncToSupabase, isLoaded } = useLocalStats(projectId);

  // Fetch stats from API
  const fetchStats = async (type: 'daily' | 'weekly' | 'monthly') => {
    try {
      const response = await fetch(`/api/stats/${projectId}?type=${type}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} stats`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${type} stats:`, error);
      return null;
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch from Supabase
        const [daily, weekly, monthly] = await Promise.all([
          fetchStats('daily'),
          fetchStats('weekly'),
          fetchStats('monthly'),
        ]);

        // Merge daily with local
        const mergedDaily = mergeWithSupabase(daily || {});
        setDailyStats(mergedDaily);
        setWeeklyStats(weekly);
        setMonthlyStats(monthly);

        // Sync local to Supabase
        await syncToSupabase();

        console.log('Stats loaded and synced');
      } catch (error) {
        console.error('Error loading stats:', error);
        setError('Failed to load stats. Showing local data only.');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && isLoaded) {
      loadStats();
    }
  }, [projectId, isLoaded, mergeWithSupabase, syncToSupabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <BarChart3 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading your focus journey...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="container mx-auto px-4 py-8"
        >
          <StatsModal
            isOpen={true}
            onClose={() => window.history.back()}
            lastActiveDate={dailyStats?.date}
            statsData={{
              daily: dailyStats,
              weekly: weeklyStats,
              monthly: monthlyStats,
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
