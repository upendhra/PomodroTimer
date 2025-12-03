import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'daily';

  try {
    // Generate report based on type
    let reportData = {};

    if (type === 'daily') {
      const { data: sessions, error: sessionError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (sessionError) throw sessionError;

      const totalTime = sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
      reportData = { totalTime, sessionsCount: sessions.length };
    } else if (type === 'weekly') {
      const { data: sessions, error: sessionError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (sessionError) throw sessionError;

      const totalTime = sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
      reportData = { totalTime, sessionsCount: sessions.length };
    } else if (type === 'monthly') {
      const { data: sessions, error: sessionError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (sessionError) throw sessionError;

      const totalTime = sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
      reportData = { totalTime, sessionsCount: sessions.length };
    }

    return NextResponse.json({ success: true, report: reportData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
