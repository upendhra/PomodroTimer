'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Target } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  duration_type: string;
  start_date: string | null;
  end_date: string | null;
  weekdays: string[];
  planned_hours: Record<string, number>;
}

interface ProjectStatsProps {
  project: Project;
}

export default function ProjectStats({ project }: ProjectStatsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTotalWeeklyHours = () => {
    return Object.values(project.planned_hours).reduce((sum, hours) => sum + hours, 0);
  };

  const getAverageDailyHours = () => {
    const totalHours = getTotalWeeklyHours();
    const weekdayCount = project.weekdays?.length || 0;
    return weekdayCount > 0 ? (totalHours / weekdayCount).toFixed(1) : '0';
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/20 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.55)] max-w-2xl w-full mx-4 transition-all duration-1000 animate-fade-in ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200/70 via-purple-300/40 to-pink-500/10 opacity-80"></div>
      <div className="absolute inset-0 bg-white/10 mix-blend-soft-light"></div>
      <div className="relative">
        <div className="text-center mb-6">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-2xl shadow-inner">
              <Target className="w-8 h-8" />
            </div>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_5px_25px_rgba(15,23,42,0.45)] mb-2">
            Project Goals
          </h3>
          <p className="text-base text-white/85">
            Duration Type: <span className="font-semibold capitalize">{project.duration_type}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-300" />
              <span className="text-sm font-medium text-white/90">Timeline</span>
            </div>
            <div className="space-y-1 text-sm text-white/80">
              <div>Start: {formatDate(project.start_date)}</div>
              <div>End: {formatDate(project.end_date)}</div>
              <div>Days: {project.weekdays?.join(', ') || 'Not set'}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-green-300" />
              <span className="text-sm font-medium text-white/90">Hours</span>
            </div>
            <div className="space-y-1 text-sm text-white/80">
              <div>Weekly: {getTotalWeeklyHours()}h</div>
              <div>Daily Avg: {getAverageDailyHours()}h</div>
              <div>Active Days: {project.weekdays?.length || 0}</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-white/75">
            Stay focused and achieve your goals one session at a time.
          </p>
        </div>
      </div>
    </div>
  );
}
