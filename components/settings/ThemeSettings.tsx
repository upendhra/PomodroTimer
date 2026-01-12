'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Image as ImageIcon, Palette, Upload, X } from 'lucide-react';
import { generateWallpaperThumbnail } from '@/utils/generateThumbnail';
import { useTheme } from '@/hooks/useTheme';

interface Theme {
  id: string;
  name: string;
  category: string;
  type: 'wallpaper' | 'color_scheme';
  wallpaper_url?: string;
  preview_image_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
}

interface SpotlightPreset {
  id: string;
  name: string;
  tone: 'Dark' | 'Light';
  mood: string;
  background: string;
  corners: [string, string, string, string];
  center: { inner: string; outer: string };
}

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Categories', matches: [] },
  { id: 'study-room', label: 'Study Room', matches: ['minimal', 'urban'] },
  { id: 'aurora', label: 'Aurora', matches: ['space', 'gradient'] },
  { id: 'nature', label: 'Nature', matches: ['nature'] },
  { id: 'calm', label: 'Calm', matches: ['minimal', 'gradient'] },
  { id: 'peace', label: 'Peace', matches: ['nature', 'abstract'] },
];

const DEFAULT_SPOTLIGHT_THEME = 'spotlight-nebula-noir';

const BASE_THEMES = [
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Pure black focus arena',
    bg: '#000000',
    primary: '#7c3aed',
    secondary: '#6366f1',
    accent: '#8b5cf6',
  },
  {
    id: 'spotlight-mode',
    name: 'Spotlight Mode',
    description: '10 premium lighting presets',
    bg: '#05030d',
    primary: '#6a50ff',
    secondary: '#2dd4ff',
    accent: '#fd6fff',
  },
];

const COLOR_SCHEMES = BASE_THEMES;

const SPOTLIGHT_PRESETS: SpotlightPreset[] = [
  {
    id: 'spotlight-nebula-noir',
    name: 'Nebula Noir',
    tone: 'Dark',
    mood: 'Cosmic command center',
    background: '#05030d',
    corners: ['#6a50ff', '#2dd4ff', '#fd6fff', '#ffc857'],
    center: { inner: '#f5f7ff', outer: '#080612' },
  },
  {
    id: 'spotlight-obsidian-pulse',
    name: 'Obsidian Pulse',
    tone: 'Dark',
    mood: 'Stealth energy',
    background: '#04070b',
    corners: ['#0cda9d', '#2dd4bf', '#a855f7', '#f4a261'],
    center: { inner: '#d9fffb', outer: '#06060b' },
  },
  {
    id: 'spotlight-crimson-eclipse',
    name: 'Crimson Eclipse',
    tone: 'Dark',
    mood: 'Cinematic dusk',
    background: '#120507',
    corners: ['#b91c1c', '#ff8c42', '#7c3aed', '#2563eb'],
    center: { inner: '#ffd8c2', outer: '#1b0505' },
  },
  {
    id: 'spotlight-arctic-aurora',
    name: 'Arctic Aurora',
    tone: 'Dark',
    mood: 'Icy calm',
    background: '#030713',
    corners: ['#38bdf8', '#a5f3fc', '#c4b5fd', '#64748b'],
    center: { inner: '#e2f6ff', outer: '#050814' },
  },
  {
    id: 'spotlight-sable-prism',
    name: 'Sable Prism',
    tone: 'Dark',
    mood: 'Prismatic night',
    background: '#03030a',
    corners: ['#84cc16', '#f472b6', '#2563eb', '#f59e0b'],
    center: { inner: '#f2f6ff', outer: '#05030a' },
  },
  {
    id: 'spotlight-morning-glow',
    name: 'Morning Spotlight',
    tone: 'Light',
    mood: 'Dawn energy',
    background: '#fff5e7',
    corners: ['#ffd7ba', '#ffef9f', '#ffb4a2', '#f4dada'],
    center: { inner: '#ffffff', outer: '#f6eada' },
  },
  {
    id: 'spotlight-pastel-studio',
    name: 'Pastel Studio',
    tone: 'Light',
    mood: 'Creative hush',
    background: '#f6f4fb',
    corners: ['#c7d2fe', '#e9d5ff', '#bbf7d0', '#fecdd3'],
    center: { inner: '#ffffff', outer: '#f1f5f9' },
  },
  {
    id: 'spotlight-cloud-beam',
    name: 'Cloud Beam',
    tone: 'Light',
    mood: 'Airy focus',
    background: '#f8fbff',
    corners: ['#bae6fd', '#e2e8f0', '#ddd6fe', '#c8f7ef'],
    center: { inner: '#ffffff', outer: '#edf2fb' },
  },
  {
    id: 'spotlight-golden-hour',
    name: 'Golden Hour',
    tone: 'Light',
    mood: 'Sunset spark',
    background: '#fff3dc',
    corners: ['#fbbf24', '#f97316', '#fda4af', '#facc15'],
    center: { inner: '#fff9ef', outer: '#f9e5c3' },
  },
  {
    id: 'spotlight-minimal-veil',
    name: 'Minimal Veil',
    tone: 'Light',
    mood: 'Gallery calm',
    background: '#f7f7f4',
    corners: ['#d4d4d8', '#a8a29e', '#e4e4e7', '#f5f5f4'],
    center: { inner: '#ffffff', outer: '#ececec' },
  },
  {
    id: 'spotlight-royal-porcelain',
    name: 'Royal Porcelain',
    tone: 'Light',
    mood: 'Regal sophistication',
    background: '#f8f7fc',
    corners: ['#5b21b6', '#3b82f6', '#c4b5fd', '#e0e7ff'],
    center: { inner: '#fdfcff', outer: '#f3f2f9' },
  },
  {
    id: 'spotlight-pearl-aurora',
    name: 'Pearl Aurora',
    tone: 'Light',
    mood: 'Ethereal shimmer',
    background: '#f0f9ff',
    corners: ['#06b6d4', '#8b5cf6', '#e0e7ff', '#ccfbf1'],
    center: { inner: '#ffffff', outer: '#e5f6fc' },
  },
  {
    id: 'spotlight-champagne-silk',
    name: 'Champagne Silk',
    tone: 'Light',
    mood: 'Luxe warmth',
    background: '#fef8f3',
    corners: ['#be185d', '#d97706', '#fbbf24', '#f9a8d4'],
    center: { inner: '#fffcf8', outer: '#fceee0' },
  },
];

export default function ThemeSettings() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedColorScheme, setSelectedColorScheme] = useState('dark-mode');
  const [selectedSpotlightPreset, setSelectedSpotlightPreset] = useState(DEFAULT_SPOTLIGHT_THEME);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [spotlightExpanded, setSpotlightExpanded] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('nature');
  const [uploading, setUploading] = useState(false);
  const { theme: activeTheme, setTheme: setGlobalTheme } = useTheme();

  useEffect(() => {
    fetchThemes();
  }, []);

  useEffect(() => {
    console.log('[ThemeSettings] useEffect - Loading saved theme');
    const saved = localStorage.getItem('color-scheme-theme') || 'dark-mode';
    console.log('[ThemeSettings] Loaded from localStorage:', saved);
    
    // Check if it's a spotlight preset
    if (saved.startsWith('spotlight-')) {
      setSelectedSpotlightPreset(saved);
      setSelectedColorScheme('spotlight-mode');
    } else {
      setSelectedColorScheme(saved);
    }
  }, []);

  useEffect(() => {
    generateThumbnails();
  }, [themes]);

  useEffect(() => {
    if (activeTheme?.id) {
      setSelectedTheme(activeTheme.id);
    }
  }, [activeTheme?.id]);

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes');
      const result = await response.json();
      if (result.success) {
        setThemes(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnails = async () => {
    const newThumbnails: Record<string, string> = {};
    
    for (const theme of themes) {
      if (theme.type === 'wallpaper' && theme.wallpaper_url) {
        try {
          const thumbnail = await generateWallpaperThumbnail(theme.wallpaper_url, 150, 100);
          if (thumbnail) {
            newThumbnails[theme.id] = thumbnail;
          }
        } catch (error) {
          console.error(`Failed to generate thumbnail for ${theme.name}:`, error);
        }
      } else if (theme.type === 'color_scheme') {
        const thumbnail = generateColorSchemeThumbnail(
          theme.background_color || '#ffffff',
          theme.primary_color || '#3b82f6',
          theme.secondary_color || '#6366f1',
          theme.accent_color || '#8b5cf6'
        );
        newThumbnails[theme.id] = thumbnail;
      }
    }
    
    setThumbnails(newThumbnails);
  };

  const filteredThemes = themes.filter((theme) => {
    if (theme.type !== 'wallpaper') return false;
    if (selectedCategoryFilter === 'all') return true;
    const filter = CATEGORY_FILTERS.find((cat) => cat.id === selectedCategoryFilter);
    if (!filter) return true;
    if (!filter.matches.length) return true;
    return filter.matches.some(
      (match) => theme.category?.toLowerCase() === match.toLowerCase()
    );
  });

  const handleThemeSelection = async (theme: Theme) => {
    setSelectedTheme(theme.id);
    try {
      await setGlobalTheme(theme);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName.trim());
      formData.append('category', uploadCategory);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Refresh themes list
        await fetchThemes();
        // Reset form
        setUploadFile(null);
        setUploadName('');
        setUploadCategory('nature');
        setShowUpload(false);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleColorSchemeSelection = (schemeId: string) => {
    console.log('[ThemeSettings] handleColorSchemeSelection called with:', schemeId);
    setSelectedColorScheme(schemeId);
    
    if (schemeId === 'spotlight-mode') {
      // Use the currently selected spotlight preset
      const themeToApply = selectedSpotlightPreset;
      localStorage.setItem('color-scheme-theme', themeToApply);
      document.documentElement.setAttribute('data-theme', themeToApply);
      console.log('[ThemeSettings] Applied spotlight preset:', themeToApply);
    } else {
      localStorage.setItem('color-scheme-theme', schemeId);
      document.documentElement.setAttribute('data-theme', schemeId);
      console.log('[ThemeSettings] Applied base theme:', schemeId);
    }
  };

  const handleSpotlightPresetSelection = (presetId: string) => {
    console.log('[ThemeSettings] handleSpotlightPresetSelection called with:', presetId);
    setSelectedSpotlightPreset(presetId);
    setSelectedColorScheme('spotlight-mode');
    localStorage.setItem('color-scheme-theme', presetId);
    document.documentElement.setAttribute('data-theme', presetId);
    console.log('[ThemeSettings] Spotlight preset applied:', presetId);
  };

  const selectedWallpaper = themes.find((t) => t.id === selectedTheme);

  return (
    <div className="space-y-6">
      {/* Color Scheme Section */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
            <Palette className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Color Scheme</h3>
            <p className="text-xs text-white/50">Choose your preferred color mode</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = selectedColorScheme === scheme.id;
            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() => handleColorSchemeSelection(scheme.id)}
                className={`group relative overflow-hidden rounded-xl border transition ${
                  isSelected
                    ? 'border-blue-400/70 bg-blue-400/10 ring-2 ring-blue-400/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="flex h-14 w-16 flex-col overflow-hidden rounded-lg border border-white/10">
                    <div className="flex-1" style={{ backgroundColor: scheme.bg }} />
                    <div className="flex h-4">
                      <span className="flex-1" style={{ backgroundColor: scheme.primary }} />
                      <span className="flex-1" style={{ backgroundColor: scheme.secondary }} />
                    </div>
                    <div className="h-2" style={{ backgroundColor: scheme.accent }} />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-left text-sm font-medium text-white">{scheme.name}</p>
                    <div className="mt-1 flex items-center gap-1">
                      {[scheme.bg, scheme.primary, scheme.secondary, scheme.accent].map((color, idx) => (
                        <span
                          key={`${scheme.id}-color-${idx}`}
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute right-2 top-2 rounded-full bg-blue-500 p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Spotlight Presets Section - Collapsible */}
        {selectedColorScheme === 'spotlight-mode' && (
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setSpotlightExpanded(!spotlightExpanded)}
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:border-white/20 hover:bg-white/10 transition"
            >
              <span>Choose Preset ({SPOTLIGHT_PRESETS.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${spotlightExpanded ? 'rotate-180' : ''}`} />
            </button>
            {spotlightExpanded && (
              <div className="grid grid-cols-5 gap-2">
                {SPOTLIGHT_PRESETS.map((preset) => {
                  const isPresetSelected = selectedSpotlightPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSpotlightPresetSelection(preset.id)}
                      className={`group relative flex flex-col items-center gap-2 rounded-lg border p-2 transition ${
                        isPresetSelected
                          ? 'border-emerald-400/70 bg-emerald-400/10 ring-1 ring-emerald-400/30'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                      title={`${preset.name} - ${preset.mood}`}
                    >
                      <div className="relative h-12 w-12 overflow-hidden rounded-md border border-white/10">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `
                              radial-gradient(circle at 10% 10%, ${preset.corners[0]} 0%, transparent 50%),
                              radial-gradient(circle at 90% 10%, ${preset.corners[1]} 0%, transparent 50%),
                              radial-gradient(circle at 10% 90%, ${preset.corners[2]} 0%, transparent 50%),
                              radial-gradient(circle at 90% 90%, ${preset.corners[3]} 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, ${preset.center.inner} 0%, ${preset.center.outer} 100%)
                            `,
                            backgroundBlendMode: 'screen',
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="text-[10px] font-medium text-white">{preset.name}</p>
                        <span className={`text-[8px] uppercase tracking-wider ${
                          preset.tone === 'Dark' ? 'text-slate-400' : 'text-amber-300'
                        }`}>
                          {preset.tone}
                        </span>
                      </div>
                      {isPresetSelected && (
                        <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-0.5">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Wallpaper Section */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20">
            <ImageIcon className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Wallpaper</h3>
            <p className="text-xs text-white/50">Select a background for your workspace</p>
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-white/80">Choose a wallpaper</label>
          <div className="relative">
            <select
              value={selectedCategoryFilter}
              onChange={(event) => setSelectedCategoryFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-sm text-white/90 shadow-[inset_0_1px_8px_rgba(15,23,42,0.65)] transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {CATEGORY_FILTERS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          {loading ? (
            <p className="text-center text-sm text-white/50">Loading themes...</p>
          ) : filteredThemes.length === 0 ? (
            <p className="text-center text-sm text-white/50">No wallpapers in this category</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {filteredThemes.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelection(theme)}
                    className={`group relative overflow-hidden rounded-lg border transition ${
                      isSelected
                        ? 'border-cyan-400/70 bg-cyan-400/10 ring-2 ring-cyan-400/30'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="aspect-video w-full">
                      {thumbnails[theme.id] ? (
                        <img
                          src={thumbnails[theme.id]}
                          alt={theme.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-800">
                          <ImageIcon className="h-6 w-6 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-white">{theme.name}</p>
                      <p className="text-[10px] text-white/50 capitalize">{theme.category}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 rounded-full bg-cyan-500 p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview of Selected Wallpaper */}
        {selectedWallpaper && thumbnails[selectedWallpaper.id] && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="mb-2 text-xs font-medium text-white/70">Preview</p>
            <div className="overflow-hidden rounded-lg">
              <img
                src={thumbnails[selectedWallpaper.id]}
                alt={selectedWallpaper.name}
                className="w-full"
              />
            </div>
          </div>
        )}
      </section>

      {/* Upload Section */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <Upload className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Upload Wallpaper</h3>
              <p className="text-xs text-white/50">Add your own wallpapers to the collection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:border-white/40 hover:bg-white/10"
          >
            {showUpload ? 'Cancel' : 'Upload'}
          </button>
        </div>

        {showUpload && (
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Wallpaper File</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-white/20 bg-slate-950/70 px-3 py-2 text-sm text-white/90 file:mr-4 file:rounded file:border-0 file:bg-cyan-500 file:px-3 file:py-1 file:text-sm file:text-white hover:file:bg-cyan-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Wallpaper Name</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g., My Favorite Scene"
                className="w-full rounded-lg border border-white/20 bg-slate-950/70 px-3 py-2 text-sm text-white/90 placeholder:text-white/50 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-slate-950/70 px-3 py-2 text-sm text-white/90 focus:border-blue-400 focus:outline-none"
              >
                <option value="nature">Nature</option>
                <option value="abstract">Abstract</option>
                <option value="minimal">Minimal</option>
                <option value="urban">Urban</option>
                <option value="space">Space</option>
                <option value="gradient">Gradient</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!uploadFile || !uploadName.trim() || uploading}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Wallpaper'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
