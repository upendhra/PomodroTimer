import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Settings update auth error:', authError.message);
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Please log in to save settings',
        requiresAuth: true
      }, { status: 401 });
    }

    if (!user) {
      console.warn('Settings update: No user session found');
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'No active session. Please log in.',
        requiresAuth: true
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      theme_id,
      music_id,
      quote_category,
      notification_email,
      notification_inapp,
      notification_desktop,
      report_frequency,
      timer_type,
      pomodoro_duration_mode,
      default_focus_duration,
      default_short_break,
      default_long_break,
      countdown_minutes,
      auto_start_breaks,
      auto_start_pomodoros,
      long_break_interval,
      auto_check_tasks,
      send_completed_to_bottom,
      alerts_enabled,
      alert_frequency,
      stay_on_task_repeat,
      stay_on_task_fallback
    } = body;

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        theme_id,
        music_id,
        quote_category,
        notification_email,
        notification_inapp,
        notification_desktop,
        report_frequency,
        timer_type,
        pomodoro_duration_mode,
        default_focus_duration,
        default_short_break,
        default_long_break,
        countdown_minutes,
        auto_start_breaks,
        auto_start_pomodoros,
        long_break_interval,
        auto_check_tasks,
        send_completed_to_bottom,
        alerts_enabled,
        alert_frequency,
        stay_on_task_repeat,
        stay_on_task_fallback,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({
      error: 'Failed to update settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
