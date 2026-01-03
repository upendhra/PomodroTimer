import { createBrowserClient } from '@supabase/ssr'

let supabase: ReturnType<typeof createBrowserClient> | undefined

export const createClient = () => {
  if (supabase) return supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase environment variables are not configured')
    throw new Error('Supabase configuration missing. Please check your .env.local file.')
  }

  if (supabaseUrl === 'your-supabase-project-url' || supabaseAnonKey === 'your-supabase-anon-key') {
    console.error('❌ Supabase environment variables are using placeholder values')
    throw new Error('Supabase configuration contains placeholder values. Please update your .env.local file.')
  }

  try {
    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    })

    return supabase
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error
  }
}
