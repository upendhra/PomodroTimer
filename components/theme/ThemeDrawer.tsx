"use client";

import { Palette, X } from "lucide-react";

const THEME_PRESETS = [
  {
    id: "nebula-night",
    title: "Nebula Night",
    subtitle: "Lavender nebula glow",
    wallpaperUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    swatches: ["#a855f7", "#6366f1", "#0f172a"],
  },
  {
    id: "aurora-waves",
    title: "Aurora Waves",
    subtitle: "Nordic cyan ribbons",
    wallpaperUrl:
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
    swatches: ["#22d3ee", "#34d399", "#0b1120"],
  },
  {
    id: "desert-dusk",
    title: "Desert Dusk",
    subtitle: "Amber horizon haze",
    wallpaperUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    swatches: ["#f59e0b", "#f97316", "#1f2937"],
  },
  {
    id: "midnight-minimal",
    title: "Midnight Minimal",
    subtitle: "Soft monochrome calm",
    wallpaperUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    swatches: ["#f3f4f6", "#94a3b8", "#0f172a"],
  },
];

export type ThemePreset = (typeof THEME_PRESETS)[number];

interface ThemeDrawerProps {
  open: boolean;
  onClose: () => void;
  currentThemeId?: string | null;
  onSelect: (theme: ThemePreset) => void;
  positionClass?: string;
}

export default function ThemeDrawer({
  open,
  onClose,
  currentThemeId,
  onSelect,
  positionClass = "fixed right-6 top-24",
}: ThemeDrawerProps) {
  return (
    <div
      className={`pointer-events-none ${positionClass} z-30 transition-all duration-300 ${
        open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div className="pointer-events-auto w-64 rounded-3xl border border-white/20 bg-white/10 p-4 text-white shadow-xl backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <span className="inline-flex items-center gap-1">
            <Palette className="h-3 w-3" />
            Themes
          </span>
          <button
            type="button"
            aria-label="Close theme drawer"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 p-1 text-white transition hover:bg-white/15"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {THEME_PRESETS.map((theme) => {
            const isActive = currentThemeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelect(theme)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-emerald-300/70 bg-emerald-400/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {theme.title}
                  </p>
                  <p className="text-xs text-white/70">{theme.subtitle}</p>
                </div>
                <div className="flex items-center gap-1">
                  {theme.swatches.map((color) => (
                    <span
                      key={color}
                      className="h-6 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
