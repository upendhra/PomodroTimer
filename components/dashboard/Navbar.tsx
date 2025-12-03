"use client";

import { useEffect, useMemo, useState } from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

interface NavbarProps {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ sidebarExpanded, onToggleSidebar }: NavbarProps) {
  const [dateTime, setDateTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const localeInfo = useMemo(() => {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
    const segments = timeZone?.split("/") ?? [];
    const countryOrCity = segments[1]?.replace(/_/g, " ") ?? segments[0] ?? "Your Locale";
    return countryOrCity;
  }, []);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dateTime);

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(dateTime);

  return (
    <header className="flex flex-col gap-5 text-white">
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-white/40"
          aria-pressed={sidebarExpanded}
          aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarExpanded ? (
            <PanelLeftClose className="h-5 w-5" strokeWidth={1.7} />
          ) : (
            <PanelLeftOpen className="h-5 w-5" strokeWidth={1.7} />
          )}
        </button>

        <div className="text-left">
          <p className="text-sm font-medium text-white/80">Welcome back, Astral Creator</p>
          <p className="text-base text-white/70">
            {localeInfo} · {formattedDate} · {formattedTime}
          </p>
        </div>
      </div>
    </header>
  );
}
