import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Try to get authenticated user, but don't require it
  let userId: string | null = null;

  try {
    console.log('🔍 Starting auth check...');

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('🍪 Available cookies:', allCookies.map(c => c.name));

    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
    );

    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError) {
      console.log('❌ Auth error:', authError);
    }

    console.log('📊 User data:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email
    });

    if (user) {
      userId = user.id;
      console.log('✅ User authenticated, using user_id:', userId);
    } else {
      console.log('⚠️ No user found, proceeding without user_id');
    }
  } catch (authError) {
    console.log('⚠️ Auth check failed, proceeding without user_id:', authError);
    console.log('🔍 Full error:', authError);
  }

  // Use anon client for database operations (works with or without auth)
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let body;
  try {
    const rawBody = await request.text();
    console.log('📦 Raw request body length:', rawBody.length);
    console.log('📦 Raw request body preview:', rawBody.substring(0, 200));
    
    if (!rawBody || rawBody.trim() === '') {
      console.error('❌ Empty request body received');
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }
    
    body = JSON.parse(rawBody);
    console.log('✅ Successfully parsed JSON body');
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError);
    return NextResponse.json({ 
      error: 'Invalid JSON in request body', 
      details: parseError instanceof Error ? parseError.message : 'Unknown error'
    }, { status: 400 });
  }

  try {
    const {
      projectId,
      date,
      focusSessions,
      currentStreak,
      longestStreak,
      tasksCompleted,
      tasksCreated,
      plannedHours,
      completedHours,
      totalSessionTime,
      breakSessions,
      focused_alerts,
      deviated_alerts,
      break_time,
      deviation_time,
      focus_time,
      long_break_time,
      sessions // Array of session records for recent_sessions table
    } = body;

    // Validate required fields
    if (!projectId || !date) {
      return NextResponse.json({ error: 'Missing required fields: projectId, date' }, { status: 400 });
    }

    // Insert/Update daily achievements (user_id is optional)
    const achievementRecord: any = {
      project_id: projectId,
      date: date,
      focus_sessions: focusSessions || 0,
      current_streak: currentStreak || 0,
      longest_streak: longestStreak || 0,
      tasks_completed: tasksCompleted || 0,
      tasks_created: tasksCreated || 0,
      planned_hours: plannedHours || 0,
      completed_hours: completedHours || 0,
      total_session_time: totalSessionTime || 0,
      break_sessions: breakSessions || 0,
      focused_alerts: focused_alerts || 0,
      deviated_alerts: deviated_alerts || 0,
      break_time: break_time || 0,
      deviation_time: deviation_time || 0,
      focus_time: focus_time || 0,
      long_break_time: long_break_time || 0,
      updated_at: new Date().toISOString()
    };

    // Add user_id only if authenticated
    if (userId) {
      achievementRecord.user_id = userId;
    }

    const { data: achievementData, error: achievementError } = await supabase
      .from('daily_achievements')
      .upsert(achievementRecord, {
        onConflict: 'project_id,date'
      });

    if (achievementError) {
      console.error('Failed to save daily achievements:', achievementError);
      throw achievementError;
    }

    // Insert session records if provided
    if (sessions && Array.isArray(sessions) && sessions.length > 0) {
      const sessionRecords = sessions.map(session => {
        // Map session types to match database constraint
        const mapSessionType = (type: string) => {
          switch (type) {
            case 'short': return 'short_break';
            case 'long': return 'long_break';
            case 'focus': return 'focus';
            default: return type;
          }
        };

        const record: any = {
          project_id: projectId,
          task_id: session.taskId || null,
          task_title: session.taskTitle || '',
          date: date,
          start_time: session.startTime,
          end_time: session.endTime,
          duration_minutes: Math.round(session.duration || 0), // FIX: Round to integer
          session_type: mapSessionType(session.type),
          completed: session.completed !== false
        };
        
        // Add user_id only if authenticated
        if (userId) {
          record.user_id = userId;
        }
        
        return record;
      });

      const { error: sessionError } = await supabase
        .from('recent_sessions')
        .insert(sessionRecords);

      if (sessionError) {
        console.error('Failed to save session records:', sessionError);
        // Don't throw here - achievements were saved successfully
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily achievements synced successfully',
      data: achievementData
    });

  } catch (error) {
    console.error('Failed to sync daily achievements:', error);
    return NextResponse.json({ error: 'Failed to sync daily achievements' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Try to get authenticated user, but don't require it (consistent with POST)
  let userId: string | null = null;

  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
    );
    
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (authError) {
    console.log('⚠️ Auth check failed in PATCH:', authError);
  }

  // Use anon client for database operations
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const body = await request.json();
    const {
      projectId,
      date,
      focusSessions,
      currentStreak,
      longestStreak,
      tasksCompleted,
      tasksCreated,
      plannedHours,
      completedHours,
      totalSessionTime,
      breakSessions,
      focused_alerts,
      deviated_alerts,
      break_time,
      deviation_time,
      focus_time,
      long_break_time
    } = body;

    // Validate required fields
    if (!projectId || !date) {
      return NextResponse.json({ error: 'Missing required fields: projectId, date' }, { status: 400 });
    }

    // FIX 2: Conditional logic - check if record exists for today
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    if (isToday) {
      // FIX 2: For today, get existing record and add to it (except for streaks which are absolute)
      const { data: existingRecord } = await supabase
        .from('daily_achievements')
        .select('*')
        .eq('project_id', projectId)
        .eq('date', date)
        .eq('user_id', userId) // FIX 5: Add user_id filtering
        .single();

      const updatedRecord = {
        project_id: projectId,
        date: date,
        user_id: userId,
        focus_sessions: (existingRecord?.focus_sessions || 0) + (focusSessions || 0),
        // STREAK FIX: Use absolute values for streaks, not accumulation
        current_streak: currentStreak !== undefined ? currentStreak : (existingRecord?.current_streak || 0),
        longest_streak: longestStreak !== undefined ? longestStreak : (existingRecord?.longest_streak || 0),
        tasks_completed: (existingRecord?.tasks_completed || 0) + (tasksCompleted || 0),
        tasks_created: Math.max(existingRecord?.tasks_created || 0, tasksCreated || 0),
        planned_hours: Math.max(existingRecord?.planned_hours || 0, plannedHours || 0),
        completed_hours: (existingRecord?.completed_hours || 0) + (completedHours || 0),
        total_session_time: (existingRecord?.total_session_time || 0) + (totalSessionTime || 0),
        break_sessions: (existingRecord?.break_sessions || 0) + (breakSessions || 0),
        focused_alerts: (existingRecord?.focused_alerts || 0) + (focused_alerts || 0),
        deviated_alerts: (existingRecord?.deviated_alerts || 0) + (deviated_alerts || 0),
        break_time: (existingRecord?.break_time || 0) + (break_time || 0),
        deviation_time: (existingRecord?.deviation_time || 0) + (deviation_time || 0),
        focus_time: (existingRecord?.focus_time || 0) + (focus_time || 0),
        long_break_time: (existingRecord?.long_break_time || 0) + (long_break_time || 0),
        updated_at: new Date().toISOString()
      };

      const { data: updateData, error: updateError } = await supabase
        .from('daily_achievements')
        .upsert(updatedRecord, {
          onConflict: 'project_id,date'
        });

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: 'Daily achievements updated incrementally',
        data: updateData
      });
    } else {
      // FIX 2: For past dates, reset/create new record (don't accumulate old data)
      const resetRecord = {
        project_id: projectId,
        date: date,
        user_id: userId,
        focus_sessions: focusSessions || 0,
        current_streak: currentStreak || 0,
        longest_streak: longestStreak || 0,
        tasks_completed: tasksCompleted || 0,
        tasks_created: tasksCreated || 0,
        planned_hours: plannedHours || 0,
        completed_hours: completedHours || 0,
        total_session_time: totalSessionTime || 0,
        break_sessions: breakSessions || 0,
        focused_alerts: focused_alerts || 0,
        deviated_alerts: deviated_alerts || 0,
        break_time: break_time || 0,
        deviation_time: deviation_time || 0,
        focus_time: focus_time || 0,
        long_break_time: long_break_time || 0,
        updated_at: new Date().toISOString()
      };

      const { data: resetData, error: resetError } = await supabase
        .from('daily_achievements')
        .upsert(resetRecord, {
          onConflict: 'project_id,date'
        });

      if (resetError) throw resetError;

      return NextResponse.json({
        success: true,
        message: 'Daily achievements reset for past date',
        data: resetData
      });
    }

  } catch (error) {
    console.error('Failed to update daily achievements:', error);
    return NextResponse.json({ error: 'Failed to update daily achievements' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 DEBUG API: GET endpoint called');

  // Try to get authenticated user, but don't require it
  let userId: string | null = null;
  
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
    );
    
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (authError) {
    console.log('⚠️ Auth check failed in GET:', authError);
  }

  // Use anon client for database operations
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const days = searchParams.get('days');
    // FIX 1: Always use today's date if no date provided
    const today = new Date().toISOString().split('T')[0];
    const date = searchParams.get('date') || today;

    console.log('🔍 DEBUG API: Request params:', { projectId, days, date, userId });

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 });
    }

    let query = supabase
      .from('daily_achievements')
      .select('*')
      .eq('project_id', projectId);

    // If days parameter provided, fetch recent days instead of single date
    if (days) {
      const daysNum = parseInt(days);
      if (!isNaN(daysNum) && daysNum > 0 && daysNum <= 365) { // Limit to 365 days max
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        query = query
          .gte('date', startDateStr)
          .order('date', { ascending: false })
          .limit(365); // Ensure we get up to 365 records
        console.log('🔍 DEBUG API: Fetching date range:', startDateStr, 'to today');
      } else {
        // Fallback to single date if days is invalid
        query = query.eq('date', date);
        console.log('🔍 DEBUG API: Invalid days parameter, falling back to single date:', date);
      }
    } else {
      // Default behavior: single date
      query = query.eq('date', date);
      console.log('🔍 DEBUG API: No days parameter, fetching single date:', date);
    }

    // Filter by user_id only if authenticated - but also include null user_id for backwards compatibility
    if (userId) {
      console.log('🔍 DEBUG API: User authenticated, filtering by user_id:', userId);
      // For authenticated users, include both their records and null user_id records (anonymous)
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    } else {
      console.log('🔍 DEBUG API: No user authentication, only null user_id records');
      query = query.is('user_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log('🔍 DEBUG API: Query executed, got', data?.length || 0, 'records');

    // DEBUG: Also count total records for this project regardless of user_id
    const { count: totalCount } = await supabase
      .from('daily_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    console.log('🔍 DEBUG API: Total records for project (all user_ids):', totalCount);

    // FIX 1: If no record exists for today, return fresh zeros (only for single date queries)
    if (!data || data.length === 0) {
      if (!days) {
        const defaultData = {
          project_id: projectId,
          date: date,
          focus_sessions: 0,
          current_streak: 0,
          longest_streak: 0,
          tasks_completed: 0,
          tasks_created: 0,
          planned_hours: 0,
          completed_hours: 0,
          total_session_time: 0,
          break_sessions: 0,
          focused_alerts: 0,
          deviated_alerts: 0,
          break_time: 0,
          deviation_time: 0,
          focus_time: 0,
          long_break_time: 0,
          user_id: userId || null
        };
        return NextResponse.json({ success: true, data: [defaultData] });
      } else {
        // For range queries, empty array is fine
        return NextResponse.json({ success: true, data: [] });
      }
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Failed to fetch daily achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch daily achievements' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Try to get authenticated user, but don't require it
  let userId: string | null = null;
  
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } } }
    );
    
    const { data: { user } } = await authClient.auth.getUser();
    if (user) {
      userId = user.id;
    }
  } catch (authError) {
    console.log('⚠️ Auth check failed in DELETE:', authError);
  }

  // Use anon client for database operations
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const date = searchParams.get('date');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 });
    }

    let query = supabase
      .from('daily_achievements')
      .delete()
      .eq('project_id', projectId);

    // If not deleting all, filter by date
    if (!deleteAll) {
      if (!date) {
        return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
      }
      query = query.eq('date', date);
    }

    // Filter by user_id only if authenticated
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) throw error;

    const message = deleteAll 
      ? `All daily achievements deleted for project ${projectId}`
      : `Daily achievements deleted for ${date}`;

    console.log(`✅ ${message}`);
    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('Failed to delete daily achievements:', error);
    return NextResponse.json({ error: 'Failed to delete daily achievements' }, { status: 500 });
  }
}
