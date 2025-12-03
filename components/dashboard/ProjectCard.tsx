import Link from "next/link";
import { Clock, CalendarDays, ArrowRight } from "lucide-react";

interface ProjectCardProps {
  project: {
    id: string;
    project_name: string;
    duration_type: string;
    start_date: string | null;
    end_date: string | null;
    weekdays: string[];
    planned_hours: Record<string, number>;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const totalPlannedHours = Object.values(project.planned_hours || {}).reduce(
    (sum, hours) => sum + (hours || 0),
    0
  );

  const durationLabel = (() => {
    switch (project.duration_type) {
      case "date_range":
        if (project.start_date && project.end_date) {
          const start = new Date(project.start_date).toLocaleDateString();
          const end = new Date(project.end_date).toLocaleDateString();
          return `${start} – ${end}`;
        }
        return "Date Range";
      case "daily":
        return "Daily";
      case "weekday_selection":
        return project.weekdays?.length ? project.weekdays.join(", ") : "Selected Weekdays";
      default:
        return "Flexible";
    }
  })();

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-lg backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400/10 via-teal-500/5 to-blue-600/10 opacity-0 transition group-hover:opacity-100" aria-hidden />

      <div className="relative flex flex-col gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Project</p>
          <h3 className="text-2xl font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {project.project_name}
          </h3>
        </div>

        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-300" />
            <span>{durationLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-300" />
            <span>{totalPlannedHours} planned hrs</span>
          </div>
        </div>

        <Link
          href={`/dashboard/projects/${project.id}`}
          className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25"
        >
          Enter Sanctuary
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
