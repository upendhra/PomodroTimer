"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useProjectCreation } from "@/hooks/useProjectCreation";

const USER_NAME = "Focus User";

export default function DashboardHome() {
  const [dateTime, setDateTime] = useState(() => new Date());
  const { openModal } = useProjectCreation();

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="relative isolate flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center text-white sm:px-10 md:px-16">
      <div className="relative flex flex-col items-center gap-6">
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
            onClick={openModal}
            className="group relative flex h-[180px] w-[180px] items-center justify-center rounded-full text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4b2ff]/60 transition-transform duration-500 ease-out hover:scale-105 active:scale-95"
            aria-label="Create new mission"
          >
            {/* Glow Halo */}
            <span className="absolute inset-[-25px] rounded-full bg-gradient-radial from-[rgba(164,124,243,0.5)] via-[rgba(122,184,255,0.4)] to-transparent blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-500 animate-pulse" />
            <span className="absolute inset-[-15px] rounded-full bg-gradient-radial from-[rgba(255,107,107,0.3)] to-transparent blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

            {/* Outer Ring */}
            <span className="absolute inset-0 rounded-full bg-gradient-radial from-[#ff6b6b]/80 via-[#4ecdc4]/60 to-[#45b7d1]/80 opacity-90 animate-shimmer" />

            {/* Inner Background */}
            <span className="absolute inset-[8px] rounded-full bg-gradient-to-br from-[#1a1f3a]/60 via-[#2d1b69]/70 to-[#7c3aed]/80 backdrop-blur-md border border-white/20 animate-pulse opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Ripple Effect on Click */}
            <span className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-110 group-active:opacity-0 transition-all duration-300 ease-out" />

            {/* Plus Icon */}
            <Plus className="relative z-10 h-14 w-14 text-white drop-shadow-lg" strokeWidth={2} />

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              Create Project Play Board
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
