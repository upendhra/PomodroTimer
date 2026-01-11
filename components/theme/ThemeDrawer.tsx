"use client";

import { useEffect, useState } from "react";
import { Palette, X } from "lucide-react";

export interface ThemePreset {
  id: string;
  title: string;
  subtitle: string;
  swatches: string[];
  wallpaperUrl: string;
}

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
  const [themes, setThemes] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch('/api/themes');
        const result = await response.json();
        if (result.success && result.data) {
          const themePresets: ThemePreset[] = result.data
            .filter((t: any) => t.type === 'wallpaper' && t.wallpaper_url)
            .map((t: any) => ({
              id: t.id,
              title: t.name,
              subtitle: t.category || 'Custom theme',
              swatches: [
                t.primary_color || '#3b82f6',
                t.secondary_color || '#6366f1',
                t.accent_color || '#8b5cf6'
              ],
              wallpaperUrl: t.wallpaper_url
            }));
          setThemes(themePresets);
        }
      } catch (error) {
        console.error('Failed to fetch themes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchThemes();
    }
  }, [open]);

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
          {loading ? (
            <div className="text-center text-xs text-white/50 py-4">Loading themes...</div>
          ) : themes.length === 0 ? (
            <div className="text-center text-xs text-white/50 py-4">No themes available</div>
          ) : (
            themes.map((theme: ThemePreset) => {
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
                    {theme.swatches.map((color: string) => (
                      <span
                        key={color}
                        className="h-6 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
