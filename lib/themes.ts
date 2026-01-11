import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

let themesCache: any[] = [];

export function clearThemesCache() {
  themesCache = [];
}

export async function loadThemesFromSupabase() {
  if (themesCache.length === 0) {
    const { data, error } = await supabase.from('themes').select('*');
    if (error) throw error;
    themesCache = data || [];
  }
  return themesCache;
}

export async function getThemesForPersona(persona: string) {
  const themes = await loadThemesFromSupabase();
  return themes.filter((t) => t.persona === persona);
}

export async function getThemeById(id: string) {
  try {
    const themes = await loadThemesFromSupabase();
    return themes.find((t) => t.id === id) || null;
  } catch (error) {
    console.error('Error loading theme by ID:', error);
    return null;
  }
}

export async function getDefaultThemeForPersona(persona: string) {
  try {
    const themes = await getThemesForPersona(persona);
    if (!themes || themes.length === 0) return null;
    return themes.find((t) => t.is_default) || themes[0] || null;
  } catch (error) {
    console.error('Error loading default theme for persona:', error);
    return null;
  }
}