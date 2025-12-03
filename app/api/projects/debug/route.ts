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
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        auth: 'failed',
        error: authError?.message
      });
    }

    // Get table structure (this will fail if table doesn't exist)
    let tableInfo = null;
    let tableError: any = null;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      tableInfo = data;
      tableError = error;
    } catch (err) {
      tableError = err;
    }

    // Test a simple insert to see what fails
    const testData = {
      user_id: user.id,
      title: 'DEBUG_TEST_' + Date.now(),
      project_name: 'DEBUG_TEST_' + Date.now(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert(testData)
      .select('id')
      .single();

    // Clean up test record if it was created
    if (insertData?.id) {
      await supabase.from('projects').delete().eq('id', insertData.id);
    }

    return NextResponse.json({
      auth: 'success',
      user_id: user.id,
      table_exists: !tableError,
      table_error: tableError?.message,
      has_existing_data: tableInfo && tableInfo.length > 0,
      insert_attempted: true,
      insert_success: !insertError,
      insert_error: insertError?.message,
      insert_error_code: insertError?.code,
      insert_error_details: insertError?.details,
      insert_error_hint: insertError?.hint,
      test_data_used: testData
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
