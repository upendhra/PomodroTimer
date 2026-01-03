import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { projectId, dateKey, plannedHours, completedHours, pomodoroDurationMode } = await request.json();

    if (!projectId || !dateKey) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, dateKey' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Syncing hours for project:', projectId, 'date:', dateKey, {
      plannedHours,
      completedHours,
      mode: pomodoroDurationMode
    });

    // Update or insert the daily achievements record
    const { data, error } = await supabase
      .from('daily_achievements')
      .upsert({
        user_id: user.id,
        project_id: projectId,
        date: dateKey,
        planned_hours: plannedHours || 0,
        completed_hours: completedHours || 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,date'  // Match existing API constraint
      })
      .select();

    if (error) {
      console.error('❌ Database error syncing hours:', error);
      return NextResponse.json(
        { error: 'Failed to sync hours to database' },
        { status: 500 }
      );
    }

    console.log('✅ Hours synced successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Hours synced successfully'
    });

  } catch (error) {
    console.error('❌ Error in sync-hours API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
