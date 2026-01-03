'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Image as ImageIcon, Palette, Upload, X } from 'lucide-react';
import { generateWallpaperThumbnail, generateColorSchemeThumbnail } from '@/utils/generateThumbnail';
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

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Categories', matches: [] },
  { id: 'study-room', label: 'Study Room', matches: ['minimal', 'urban'] },
  { id: 'aurora', label: 'Aurora', matches: ['space', 'gradient'] },
  { id: 'nature', label: 'Nature', matches: ['nature'] },
  { id: 'calm', label: 'Calm', matches: ['minimal', 'gradient'] },
  { id: 'peace', label: 'Peace', matches: ['nature', 'abstract'] },
];

const COLOR_SCHEMES = [
  { id: 'light', name: 'Light', bg: '#ffffff', text: '#1f2937', primary: '#3b82f6', secondary: '#6366f1', accent: '#8b5cf6' },
  { id: 'dark', name: 'Dark', bg: '#0f172a', text: '#f1f5f9', primary: '#3b82f6', secondary: '#6366f1', accent: '#8b5cf6' },
  { id: 'auto', name: 'Auto', bg: '#f3f4f6', text: '#1f2937', primary: '#3b82f6', secondary: '#6366f1', accent: '#8b5cf6' },
];

export default function ThemeSettings() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedColorScheme, setSelectedColorScheme] = useState('auto');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
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
          newThumbnails[theme.id] = thumbnail;
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

        <div className="grid grid-cols-3 gap-3">
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = selectedColorScheme === scheme.id;
            const thumbnail = generateColorSchemeThumbnail(
              scheme.bg,
              scheme.primary,
              scheme.secondary,
              scheme.accent
            );
            
            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() => setSelectedColorScheme(scheme.id)}
                className={`group relative overflow-hidden rounded-xl border transition ${
                  isSelected
                    ? 'border-blue-400/70 bg-blue-400/10 ring-2 ring-blue-400/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="aspect-video w-full">
                  <img
                    src={thumbnail}
                    alt={scheme.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium text-white">{scheme.name}</p>
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
