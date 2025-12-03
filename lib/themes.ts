import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

let themesCache: any[] = [];

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
  const themes = await loadThemesFromSupabase();
  return themes.find((t) => t.id === id);
}

export async function getDefaultThemeForPersona(persona: string) {
  const themes = await getThemesForPersona(persona);
  return themes.find((t) => t.is_default) || themes[0];
}