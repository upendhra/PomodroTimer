'use client';

import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';

interface EnterPlayButtonProps {
  projectId: string;
}

export default function EnterPlayButton({ projectId }: EnterPlayButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/projects/${projectId}/play`);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative w-56 h-56 rounded-full border border-white/30 bg-gradient-to-br from-amber-300 via-rose-400 to-emerald-400 shadow-[0_30px_80px_rgba(15,23,42,0.55)] hover:shadow-[0_0_70px_rgba(251,191,36,0.5)] transition-all duration-300 flex items-center justify-center"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
      <div className="relative z-10 flex flex-col items-center gap-2 text-[#0f172a]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-amber-500 shadow-lg">
          <Play className="w-6 h-6" />
        </div>
        <span className="text-lg font-semibold tracking-wide">Enter Play Area</span>
      </div>
    </button>
  );
}
