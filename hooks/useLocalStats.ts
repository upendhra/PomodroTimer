import { useState, useEffect, useCallback } from 'react';

interface LocalStats {
  projectId: string;
  date: string;
  tasksCompleted: number;
  focusSessions: number;
  breakSessions: number;
  currentStreak: number;
  longestStreak: number;
  plannedHours: number;
  completedHours: number;
  totalSessionTime: number;
  tasksCreated?: number; // Optional, not in main stats
}

interface MergedStats extends Omit<LocalStats, 'tasksCreated'> {}

export function useLocalStats(projectId: string) {
  const [localStats, setLocalStats] = useState<LocalStats | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Key for localStorage: `pomodroDailyStats` - matches existing play page format
  const getStorageKey = useCallback(() => `pomodroDailyStats`, []);

  // Load today's stats from localStorage
  const loadLocalStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = getStorageKey();
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if it's for today
        if (parsed.date === today) {
          // Convert from existing format to our format
          const converted: LocalStats = {
            projectId: projectId,
            date: parsed.date || today,
            tasksCompleted: parsed.tasksCompleted || 0,
            focusSessions: parsed.sessionsCompleted || 0,
            breakSessions: parsed.breakSessions || 0,
            currentStreak: 0, // From DB
            longestStreak: 0, // From DB
            plannedHours: parsed.targetHours || 0,
            completedHours: parsed.hoursWorked || 0,
            totalSessionTime: 0,
          };
          setLocalStats(converted);
          console.log('Loaded local stats from pomodroDailyStats:', converted);
        } else {
          // Old data, remove
          localStorage.removeItem(key);
          setLocalStats(null);
        }
      } else {
        setLocalStats(null);
      }
    } catch (error) {
      console.error('Error loading local stats:', error);
      setLocalStats(null);
    }
    setIsLoaded(true);
  }, [getStorageKey, projectId]);

  // Save stats to localStorage
  const saveLocalStats = useCallback((stats: LocalStats) => {
    const key = getStorageKey();
    try {
      // Save in the format expected by play page
      const toSave = {
        date: stats.date,
        tasksCompleted: stats.tasksCompleted,
        focusSessions: stats.focusSessions,
        breakSessions: stats.breakSessions,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        plannedHours: stats.plannedHours,
        completedHours: stats.completedHours,
        totalSessionTime: stats.totalSessionTime,
      };
      localStorage.setItem(key, JSON.stringify(toSave));
      setLocalStats(stats);
      console.log('Saved local stats:', stats);
    } catch (error) {
      console.error('Error saving local stats:', error);
    }
  }, [getStorageKey]);

  // Update specific fields in local stats
  const updateLocalStats = useCallback((updates: Partial<Omit<LocalStats, 'projectId' | 'date'>>) => {
    if (!localStats) return;
    const updated = { ...localStats, ...updates };
    saveLocalStats(updated);
  }, [localStats, saveLocalStats]);

  // Merge Supabase data with local (local overrides)
  const mergeWithSupabase = useCallback((supabaseData: Partial<MergedStats>): MergedStats => {
    const today = new Date().toISOString().split('T')[0];
    const base: MergedStats = {
      projectId,
      date: today,
      tasksCompleted: 0,
      focusSessions: 0,
      breakSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      plannedHours: 0,
      completedHours: 0,
      totalSessionTime: 0,
      ...supabaseData, // Supabase as base
    };

    if (localStats) {
      // Local overrides
      return {
        ...base,
        tasksCompleted: localStats.tasksCompleted,
        focusSessions: localStats.focusSessions,
        breakSessions: localStats.breakSessions,
        currentStreak: localStats.currentStreak,
        longestStreak: localStats.longestStreak,
        plannedHours: localStats.plannedHours,
        completedHours: localStats.completedHours,
        totalSessionTime: localStats.totalSessionTime,
      };
    }

    return base;
  }, [localStats, projectId]);

  // Sync to Supabase (call this in useEffect)
  const syncToSupabase = useCallback(async () => {
    if (!localStats) return { success: false, error: 'No local stats to sync' };

    try {
      const statsToSync = {
        tasksCompleted: localStats.tasksCompleted,
        focusSessions: localStats.focusSessions,
        breakSessions: localStats.breakSessions,
        currentStreak: localStats.currentStreak,
        longestStreak: localStats.longestStreak,
        plannedHours: localStats.plannedHours,
        completedHours: localStats.completedHours,
        totalSessionTime: localStats.totalSessionTime,
      };

      const response = await fetch(`/api/stats/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statsToSync),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Sync failed:', error);
        return { success: false, error: error.error || 'Sync failed' };
      }

      const result = await response.json();
      console.log('Synced to Supabase:', result);
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: 'Network error' };
    }
  }, [localStats, projectId]);

  useEffect(() => {
    loadLocalStats();
  }, [loadLocalStats]);

  return {
    localStats,
    isLoaded,
    saveLocalStats,
    updateLocalStats,
    mergeWithSupabase,
    syncToSupabase,
  };
}
