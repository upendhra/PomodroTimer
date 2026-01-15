import { create } from 'zustand';
import { getThemeById } from '@/lib/themes';

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
  setUserSelectedTheme: (themeOrId: string | any) => Promise<void>;
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

  setUserSelectedTheme: async (themeOrId: string | any) => {
    let theme = null;
    if (themeOrId === null) {
      console.log('[useTheme] setUserSelectedTheme: Clearing userSelectedTheme');
    } else if (typeof themeOrId === 'string') {
      theme = await getThemeById(themeOrId);
      console.log('[useTheme] setUserSelectedTheme: Setting theme by ID:', themeOrId, 'resolved to:', theme);
    } else {
      theme = themeOrId;
      console.log('[useTheme] setUserSelectedTheme: Setting theme object:', theme);
    }
    set({ userSelectedTheme: theme });
    get().resolveTheme();
  },

  setProjectTheme: async (id: string | null) => {
    const theme = id ? await getThemeById(id) : null;
    console.log('[useTheme] setProjectTheme: Setting project theme:', id, 'resolved to:', theme);
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
    let theme = null;

    if (customWallpaper) {
      theme = { wallpaper_url: customWallpaper };
      console.log('[useTheme] resolveTheme: Using customWallpaper:', theme);
    } else if (projectTheme) {
      theme = projectTheme;
      console.log('[useTheme] resolveTheme: Using projectTheme:', theme);
    } else if (userSelectedTheme) {
      theme = userSelectedTheme;
      console.log('[useTheme] resolveTheme: Using userSelectedTheme:', theme);
    } else {
      console.log('[useTheme] resolveTheme: No theme sources, setting theme to null');
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