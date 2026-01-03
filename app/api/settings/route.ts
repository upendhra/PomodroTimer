import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const DEFAULT_SETTINGS = {
  theme_id: null,
  music_id: null,
  quote_category: null,
  notification_email: false,
  notification_inapp: false,
  notification_desktop: false,
  report_frequency: null,
  timer_type: 'pomodoro',
  pomodoro_duration_mode: 'default',
  default_focus_duration: 25,
  default_short_break: 5,
  default_long_break: 15,
  countdown_minutes: 25,
  auto_start_breaks: true,
  auto_start_pomodoros: true,
  long_break_interval: 4,
  auto_check_tasks: true,
  send_completed_to_bottom: true,
  alerts_enabled: true,
  alert_frequency: 15,
  stay_on_task_repeat: true,
  stay_on_task_fallback: 'focused',
};

const getServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
};

export async function GET(_request: NextRequest) {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If user is authenticated, try to get their settings
    if (!authError && user) {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return NextResponse.json({ success: true, data });
      }

      // User is authenticated but has no settings - create default settings
      const { data: inserted, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...DEFAULT_SETTINGS,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({ success: true, data: inserted });
    }

    // User is not authenticated - return default settings without error
    console.log('⚠️ User not authenticated - returning default settings');
    return NextResponse.json({
      success: true,
      data: {
        id: null,
        user_id: null,
        ...DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Failed to load user settings:', error);
    return NextResponse.json(
      { error: 'Failed to load user settings' },
      { status: 500 }
    );
  }
}
