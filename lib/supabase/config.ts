// Supabase client configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseConfig.url &&
    supabaseConfig.anonKey &&
    supabaseConfig.url !== 'your-supabase-url' &&
    supabaseConfig.anonKey !== 'your-supabase-anon-key'
  )
}
