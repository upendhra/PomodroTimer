'use client';

import { useRouter } from 'next/navigation';
import { LayoutDashboard, Play } from 'lucide-react';

interface ProjectViewSwitchProps {
  projectId: string;
  activeView: 'home' | 'play';
  className?: string;
}

const VIEW_CONFIG = [
  {
    key: 'home',
    label: 'Project Home',
    icon: LayoutDashboard,
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    glow: 'shadow-[0_0_25px_rgba(52,211,153,0.55)]',
  },
  {
    key: 'play',
    label: 'Play Area',
    icon: Play,
    gradient: 'from-rose-400 via-amber-300 to-yellow-200',
    glow: 'shadow-[0_0_25px_rgba(251,191,36,0.55)]',
  },
] as const;

export default function ProjectViewSwitch({ projectId, activeView, className }: ProjectViewSwitchProps) {
  const router = useRouter();

  const handleSelect = (view: 'home' | 'play') => {
    if (!projectId || view === activeView) return;
    const path = view === 'home' ? `/dashboard/projects/${projectId}` : `/dashboard/projects/${projectId}/play`;
    router.push(path);
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 p-1 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur ${className ?? ''}`}
      role="tablist"
      aria-label="Switch between project views"
    >
      {VIEW_CONFIG.map(({ key, label, icon: Icon, gradient, glow }) => {
        const isActive = activeView === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={label}
            aria-label={label}
            onClick={() => handleSelect(key)}
            className={`group relative inline-flex h-11 w-11 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${
              isActive ? glow : 'opacity-70 hover:opacity-90'
            }`}
          >
            <span
              aria-hidden
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} ${
                isActive ? 'opacity-90 animate-pulse' : 'opacity-45'
              }`}
            ></span>
            <span
              className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition ${
                isActive ? 'text-white' : 'text-white/70'
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
