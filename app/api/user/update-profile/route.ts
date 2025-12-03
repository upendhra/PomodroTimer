import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest) {
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
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { full_name, persona, preferred_language } = body;

    if (persona && !['student', 'employee', 'writer', 'professor', 'addiction_reliever'].includes(persona)) {
      return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
    }
    if (preferred_language && !['english', 'tamil'].includes(preferred_language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ full_name, persona, preferred_language, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
