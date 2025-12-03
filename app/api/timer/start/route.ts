import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const { task_id, timer_type } = body;

    if (!timer_type) {
      return NextResponse.json({ error: 'Timer type is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('timer_sessions')
      .insert({ user_id: user.id, task_id, timer_type, started_at: new Date().toISOString() })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start timer' }, { status: 500 });
  }
}
