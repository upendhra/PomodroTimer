"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { useProjectCreation } from "@/hooks/useProjectCreation";
import { Plus } from "lucide-react";

interface Project {
  id: string;
  project_name: string;
  duration_type: string;
  start_date: string | null;
  end_date: string | null;
  weekdays: string[];
  planned_hours: Record<string, number>;
}

export default function ProjectsIndexPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openModal } = useProjectCreation();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.href = "/auth/login";
          return;
        }

        const { data, error } = await supabase
          .from("projects")
          .select("id, project_name, duration_type, start_date, end_date, weekdays, planned_hours")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          setError("Unable to load projects at the moment.");
          return;
        }

        setProjects(data ?? []);
      } catch (err) {
        console.error("Failed to fetch projects", err);
        setError("Something went wrong while loading projects.");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="relative isolate min-h-[80vh] overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(130,242,255,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(181,122,255,0.15),transparent_60%)]" />

      <div className="relative z-10 flex flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Projects</p>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your Play Boards
            </h1>
            <p className="text-white/70" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Jump back into any project to re-enter its sanctuary.
            </p>
          </div>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#82f2ff] to-[#4ecdc4] px-5 py-3 font-medium text-black transition hover:shadow-lg hover:shadow-[#82f2ff]/40"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </header>

        {loading && (
          <div className="flex min-h-[200px] items-center justify-center text-white/70">Loading projects...</div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-6 text-red-100">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center text-white/70">
            <p className="text-lg mb-4">No projects yet.</p>
            <p className="mb-6">Create your first play board to start tracking focused sessions.</p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
