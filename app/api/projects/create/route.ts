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

  console.log('=== PROJECT CREATION API STARTED ===');

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Auth check result:', { user: user?.id, authError });

  if (authError || !user) {
    console.log('Auth failed:', { authError, hasUser: !!user });
    return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Received body:', body);

    const {
      project_name,
      duration_type,
      start_date,
      end_date,
      weekdays,
      planned_hours,
      status
    } = body;

    console.log('Extracted fields:', {
      project_name,
      duration_type,
      start_date,
      end_date,
      weekdays,
      planned_hours,
      status
    });

    if (!project_name || project_name.trim() === '') {
      console.log('Validation failed: project_name is required');
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const projectData = {
      user_id: user.id,
      project_name: project_name.trim(),
      duration_type: duration_type || 'date_range',
      start_date,
      end_date,
      weekdays: weekdays || [],
      planned_hours: planned_hours || {},
      status: status || 'active'
    };

    console.log('Prepared project data for insert:', projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id')
      .single();

    console.log('Supabase insert result:', { data, error });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({
        error: 'Failed to create project',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('Project created successfully with ID:', data?.id);
    return NextResponse.json({ data: [data] }); // Return as array to match hook expectation

  } catch (error) {
    console.error('Unexpected error in project creation:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
