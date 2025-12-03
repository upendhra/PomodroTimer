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

  try {
    // Test 1: Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        status: 'auth_failed',
        authError: authError?.message,
        hasUser: !!user
      });
    }

    // Test 2: Check table exists and columns
    const { data: tableInfo, error: tableError } = await supabase
      .from('projects')
      .select('id, project_name, duration_type, start_date, end_date, weekdays, planned_hours, status, user_id')
      .limit(1);

    // Test 3: Try a simple insert (will rollback)
    const testProjectData = {
      user_id: user.id,
      project_name: 'TEST_PROJECT_' + Date.now(),
      duration_type: 'date_range',
      start_date: null,
      end_date: null,
      weekdays: [],
      planned_hours: {},
      status: 'active'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('projects')
      .insert(testProjectData)
      .select('id')
      .single();

    // If insert succeeded, delete the test record
    if (insertResult?.id) {
      await supabase.from('projects').delete().eq('id', insertResult.id);
    }

    return NextResponse.json({
      status: 'success',
      user_id: user.id,
      table_accessible: !tableError,
      table_error: tableError?.message,
      insert_successful: !insertError,
      insert_error: insertError?.message,
      insert_result: insertResult
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
