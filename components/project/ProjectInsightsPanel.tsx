'use client';

import { Flame, Sparkles } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  duration_type: string;
  start_date: string | null;
  end_date: string | null;
  weekdays: string[];
  planned_hours: Record<string, number>;
}

interface ProjectInsightsPanelProps {
  open: boolean;
  project: Project;
}

function formatDuration(project: Project) {
  if (project.duration_type === 'date_range' && project.start_date && project.end_date) {
    return `${new Date(project.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} → ${new Date(
      project.end_date,
    ).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  if (project.duration_type === 'weekday_selection' && project.weekdays.length) {
    return project.weekdays.join(' · ');
  }

  return 'Flexible cadence';
}

export default function ProjectInsightsPanel({ open, project }: ProjectInsightsPanelProps) {
  const plannedEntries = Object.entries(project.planned_hours || {}) as [string, number][];
  const totalPlanned = plannedEntries.reduce((acc, [, hours]) => acc + Number(hours), 0);
  const averageCadence = plannedEntries.length ? totalPlanned / plannedEntries.length : 0;
  const maxHours = plannedEntries.length ? Math.max(...plannedEntries.map(([, hours]) => Number(hours))) : 0;
  const spotlight = plannedEntries.reduce<[string, number]>(
    (top, current) => (Number(current[1]) > Number(top[1]) ? current : top),
    plannedEntries[0] ?? ['Focus', 0],
  );

  const displayEntries = plannedEntries.length ? plannedEntries.slice(0, 6) : [['Focus', 0]];

  return (
    <div
      className={`pointer-events-none absolute top-[5.5rem] right-[27rem] z-30 transition-all duration-300 ${
        open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className="pointer-events-auto w-[320px] rounded-[32px] border border-white/15 bg-gradient-to-br from-[#0c1b2b]/90 via-[#1b233f]/90 to-[#2f1f36]/90 p-5 text-white shadow-[0_25px_90px_rgba(14,23,41,0.85)] backdrop-blur-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Flow Insights</p>
            <p className="font-semibold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Project Pulse
            </p>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-amber-300">
            <Sparkles className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-white/85">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/50">Timeline</p>
            <p className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {formatDuration(project)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-white/50">Cadence</p>
            <p className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {averageCadence.toFixed(1)} hrs / slot
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[26px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Energy curve</p>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] text-amber-200">
              <Flame className="h-3.5 w-3.5" />
              Peak {spotlight[0]}
            </div>
          </div>

          <div className="mt-4 flex items-end gap-3 h-32">
            {displayEntries.map(([rawLabel, rawHours]) => {
              const label = String(rawLabel);
              const hours = Number(rawHours);
              const height = maxHours ? Math.max((hours / maxHours) * 100, 8) : 8;
              const isTop = label === spotlight[0];

              return (
                <div key={label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-col items-center">
                    <div className="relative flex h-24 w-full items-end rounded-2xl bg-white/10 p-1">
                      <span
                        style={{ height: `${height}%` }}
                        className={`w-full rounded-xl bg-gradient-to-t from-amber-400 via-rose-400 to-emerald-300 shadow-[0_10px_25px_rgba(251,191,36,0.35)] transition-all duration-300 ${
                          isTop ? 'ring-2 ring-amber-200/50' : ''
                        }`}
                      ></span>
                    </div>
                  </div>
                  <span className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">
                    {label.slice(0, 3)}
                  </span>
                  <span className="text-[0.65rem] text-white/70">{hours}h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
          <span>Total planned</span>
          <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {totalPlanned} hrs
          </span>
        </div>
      </div>
    </div>
  );
}
