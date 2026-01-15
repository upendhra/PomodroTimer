"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProjectCreation } from "@/hooks/useProjectCreation";
import GalaxyBackground from "@/components/visuals/GalaxyBackground";
import WaitlistPopup from "@/components/project/WaitlistPopup";

const USER_NAME = "Focus User";

interface Project {
  id: string;
  project_name: string;
  duration_type: string;
  start_date: string | null;
  end_date: string | null;
  weekdays: string[];
  planned_hours: Record<string, number> | null;
}

export default function DashboardHome() {
  const [dateTime, setDateTime] = useState(() => new Date());
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const { openModal, isOpen, isWaitlistOpen, closeWaitlist } = useProjectCreation();
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const [pulseActive, setPulseActive] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const pulseTimeoutRef = useRef<number | null>(null);
  const interactionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
      if (interactionTimeoutRef.current) window.clearTimeout(interactionTimeoutRef.current);
    };
  }, []);

  const fetchRecentProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setRecentProjects([]);
        setProjectsError(null);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id, project_name, duration_type, start_date, end_date, weekdays, planned_hours, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        setProjectsError("Unable to load recent projects.");
        setRecentProjects([]);
        return;
      }

      setRecentProjects(data ?? []);
      setProjectsError(null);
    } catch (err) {
      console.error("Failed to fetch recent projects:", err);
      setProjectsError("Something went wrong while loading recent projects.");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentProjects();
  }, [fetchRecentProjects]);

  useEffect(() => {
    const handleProjectCreated = () => {
      fetchRecentProjects();
    };
    window.addEventListener("project-created", handleProjectCreated);
    return () => {
      window.removeEventListener("project-created", handleProjectCreated);
    };
  }, [fetchRecentProjects]);

  const localeInfo = useMemo(() => {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
    const segments = timeZone?.split("/") ?? [];
    const countryOrCity = segments[1]?.replace(/_/g, " ") ?? segments[0] ?? "Your Locale";
    return {
      location: countryOrCity,
      timeZone,
    };
  }, []);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(dateTime);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dateTime);

  const paused = interactionPaused || isOpen || isWaitlistOpen;

  const handlePulse = useCallback(() => {
    if (pulseTimeoutRef.current) {
      window.clearTimeout(pulseTimeoutRef.current);
    }
    setPulseActive(true);
    pulseTimeoutRef.current = window.setTimeout(() => setPulseActive(false), 600);
  }, []);

  const pauseInteraction = useCallback(() => {
    if (interactionTimeoutRef.current) {
      window.clearTimeout(interactionTimeoutRef.current);
    }
    setInteractionPaused(true);
  }, []);

  const releaseInteraction = useCallback(() => {
    if (interactionTimeoutRef.current) {
      window.clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = window.setTimeout(() => setInteractionPaused(false), 1200);
  }, []);

  const handleCreateClick = useCallback(() => {
    pauseInteraction();
    openModal();
  }, [openModal, pauseInteraction]);

  const renderRecentProjects = () => {
    if (projectsLoading) {
      return <p className="text-sm text-white/60">Loading recent projects...</p>;
    }

    if (projectsError) {
      return <p className="text-sm text-red-300">{projectsError}</p>;
    }

    if (recentProjects.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-left text-white/70">
          <p className="text-base font-medium">No recent projects yet.</p>
          <p className="text-sm mt-1">Create a project to see it appear here.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-3">
        {recentProjects.map((project) => (
          <div
            key={project.id}
            className="group flex min-w-[240px] flex-1 basis-[260px] flex-col rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-white shadow-lg backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">Recent</p>
                <h3 className="text-lg font-semibold leading-tight break-words">{project.project_name}</h3>
              </div>
              <Link
                href={`/dashboard/projects/${project.id}/play`}
                className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-emerald-300/60 hover:text-white"
                title="Open play area"
              >
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
              <FolderKanban className="h-4 w-4 text-emerald-300" />
              <span className="truncate">
                {project.duration_type === "date_range" && project.start_date && project.end_date
                  ? `${new Date(project.start_date).toLocaleDateString()} → ${new Date(project.end_date).toLocaleDateString()}`
                  : project.duration_type === "daily"
                    ? "Daily rhythm"
                    : "Flexible cadence"}
              </span>
            </div>
            {project.weekdays && project.weekdays.length > 0 && (
              <p className="mt-2 text-xs text-white/50">
                {project.weekdays.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="relative isolate flex min-h-[80vh] flex-col items-center overflow-hidden px-6 py-16 text-white sm:px-10 md:px-16"
      onPointerDownCapture={pauseInteraction}
      onPointerUpCapture={releaseInteraction}
      onPointerLeave={releaseInteraction}
    >
      <GalaxyBackground targetRef={plusButtonRef} paused={paused} onMerge={handlePulse} />
      <div className="relative flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <div className="space-y-3">
          <p className="text-4xl font-extrabold tracking-[3px] md:text-5xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textShadow: "0 0 20px rgba(150, 180, 255, 0.4)" }}>
            Welcome{" "}
            <span className="text-4xl font-extrabold tracking-[3px] md:text-5xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", textShadow: "0 0 20px rgba(150, 180, 255, 0.4)" }}>
              {USER_NAME}
            </span>
          </p>
          <p className="text-base font-normal text-white/60 tracking-wide" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {localeInfo.location} · {formattedDate} · {formattedTime}
          </p>
          <p
            className="text-lg font-medium text-white/90"
            style={{
              fontFamily: "'Manrope', sans-serif",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.3)"
            }}
          >
            Time to recharge. A luminous week awaits!
          </p>
        </div>

        <div className="relative mt-4 flex flex-col items-center gap-4">
          <button
            type="button"
            ref={plusButtonRef}
            onClick={handleCreateClick}
            className="group relative flex h-[220px] w-[220px] items-center justify-center rounded-full text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b2ff]/40 transition-transform duration-[2000ms] ease-out hover:scale-[1.015] active:scale-95"
            aria-label="Create new mission"
            style={{
              transform: pulseActive ? "scale(1.025)" : undefined,
            }}
          >
            <span className="absolute inset-[-50px] rounded-full bg-gradient-radial from-[rgba(64,115,255,0.25)] via-transparent to-transparent blur-[80px]" />
            <span className="absolute inset-[-10px] rounded-full bg-gradient-to-b from-[#152441] via-[#0e1833] to-[#050917] opacity-90" />
            <span className="absolute inset-0 rounded-full border border-white/10" />
            <span className="absolute inset-6 rounded-full bg-gradient-to-br from-[#1b2e4f] via-[#0f1b33] to-[#050a19] shadow-[0_0_50px_rgba(72,116,255,0.35)] animate-[pulse_8s_ease-in-out_infinite]" />
            <span className="absolute inset-10 rounded-full border border-white/10 opacity-30 blur-[1px]" />
            <span className="absolute inset-11 rounded-full border border-white/5 opacity-20 blur-[2px]" />
            <span className="absolute inset-12 rounded-full bg-gradient-to-br from-[#1a2d4b] via-[#101c32] to-[#080e1c] shadow-inner" />
            <span className="absolute inset-[22px] rounded-full bg-gradient-to-br from-[#162442] via-[#0c1524] to-[#090d18] blur-[0.5px]" />
            <span className="absolute inset-[30px] rounded-full bg-[#050812] opacity-70" />
            <span className="absolute inset-[35px] rounded-full border border-white/10 opacity-20" />

            <div className="relative z-10 flex h-full w-full items-center justify-center">
              <span className="relative flex h-[70px] w-[70px] items-center justify-center rounded-full bg-gradient-to-br from-[#fff0c2] to-[#ffd15a] shadow-[0_0_35px_rgba(255,209,90,0.55)]">
                <Plus className="h-12 w-12 text-[#5f4100]" strokeWidth={1.5} />
                <span className="absolute inset-[-10px] rounded-full bg-gradient-radial from-[rgba(255,214,90,0.45)] to-transparent blur-2xl" />
              </span>
            </div>

            <div className="absolute bottom-full left-1/2 mb-4 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/70 px-3 py-1 text-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Create Project Play Planet
            </div>
          </button>
        </div>
      </div>

      <section className="mt-14 w-full max-w-4xl text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Recent</p>
            <h2 className="text-2xl font-semibold text-white">Projects you’ve touched recently</h2>
          </div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
          >
            View all projects
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6">
          {renderRecentProjects()}
        </div>
      </section>
      <WaitlistPopup isOpen={isWaitlistOpen} onClose={closeWaitlist} />
    </div>
  );
}
