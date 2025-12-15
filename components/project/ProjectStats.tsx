'use client';

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
  const totalPlannedHours = Object.values(project.planned_hours).reduce((sum, hours) => sum + hours, 0);

  const getDurationDisplay = () => {
    switch (project.duration_type) {
      case 'date_range':
        if (project.start_date && project.end_date) {
          return `${new Date(project.start_date).toLocaleDateString()} - ${new Date(project.end_date).toLocaleDateString()}`;
        }
        return 'Date Range';
      case 'daily':
        return 'Daily';
      default:
        return 'Flexible';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.55)] max-w-2xl w-full mx-4">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-cyan-300/20 to-amber-200/40"></div>
      <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
      <div className="relative">
        <h3 className="text-xl font-semibold text-white mb-4 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Project Overview
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white/90">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <Calendar className="w-4 h-4 text-emerald-200" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Duration</p>
              <p className="text-base" style={{ fontFamily: "'Manrope', sans-serif" }}>{getDurationDisplay()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <Clock className="w-4 h-4 text-amber-200" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Planned Hours</p>
              <p className="text-base" style={{ fontFamily: "'Manrope', sans-serif" }}>{totalPlannedHours} hrs</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <Target className="w-4 h-4 text-cyan-200" />
            </span>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Status</p>
                <p className="text-base" style={{ fontFamily: "'Manrope', sans-serif" }}>Active</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-semibold">Flow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
