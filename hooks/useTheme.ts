import { create } from 'zustand';
import { getThemeById, getDefaultThemeForPersona } from '@/lib/themes';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ThemeState {
  userSelectedTheme: any;
  projectTheme: any;
  customWallpaper: string | null;
  currentTheme: any;
  setUserSelectedTheme: (id: string) => Promise<void>;
  setProjectTheme: (id: string | null) => Promise<void>;
  setCustomWallpaper: (file: File) => void;
  clearCustomWallpaper: () => void;
  resolveTheme: () => Promise<void>;
}

const useThemeStore = create<ThemeState>((set, get) => ({
  userSelectedTheme: null,
  projectTheme: null,
  customWallpaper: null,
  currentTheme: null,

  setUserSelectedTheme: async (id: string) => {
    const theme = await getThemeById(id);
    set({ userSelectedTheme: theme });
    get().resolveTheme();
  },

  setProjectTheme: async (id: string | null) => {
    const theme = id ? await getThemeById(id) : null;
    set({ projectTheme: theme });
    get().resolveTheme();
  },

  setCustomWallpaper: (file: File) => {
    const url = URL.createObjectURL(file);
    set({ customWallpaper: url });
    get().resolveTheme();
  },

  clearCustomWallpaper: () => {
    const { customWallpaper } = get();
    if (customWallpaper) URL.revokeObjectURL(customWallpaper);
    set({ customWallpaper: null });
    get().resolveTheme();
  },

  resolveTheme: async () => {
    const { projectTheme, customWallpaper, userSelectedTheme } = get();
    let theme = projectTheme;
    if (customWallpaper) {
      theme = { wallpaper_url: customWallpaper };
    } else if (!theme && userSelectedTheme) {
      theme = userSelectedTheme;
    } else if (!theme) {
      // Assume persona from user profile or default
      theme = await getDefaultThemeForPersona('student'); // Placeholder, integrate with user data
    }
    set({ currentTheme: theme });
  },
}));

export const useTheme = () => {
  const store = useThemeStore();
  return {
    theme: store.currentTheme,
    setTheme: store.setUserSelectedTheme,
    applyProjectTheme: store.setProjectTheme,
    clearProjectTheme: () => store.setProjectTheme(null),
    setCustomWallpaper: store.setCustomWallpaper,
    clearCustomWallpaper: store.clearCustomWallpaper,
  };
};