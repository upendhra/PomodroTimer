import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface StatsData {
  tasksCompleted: number;
  focusSessions: number;
  breakSessions: number;
  currentStreak: number;
  longestStreak: number;
  plannedHours: number;
  completedHours: number;
  totalSessionTime: number;
  focused_alerts: number;
  deviated_alerts: number;
  break_time: number;
  deviation_time: number;
  focus_time: number;
  date?: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'daily', 'weekly', 'monthly', 'yearly'

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    if (!type || !['daily', 'weekly', 'monthly', 'yearly'].includes(type)) {
      return NextResponse.json({ error: 'Valid type required: daily, weekly, monthly, yearly' }, { status: 400 });
    }

    let data: StatsData | StatsData[] | null = null;

    if (type === 'daily') {
      // Fetch last 7 days records
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data: dailyData, error } = await supabase
        .from('daily_achievements')
        .select('tasks_completed, focus_sessions, break_sessions, current_streak, longest_streak, planned_hours, completed_hours, total_session_time, focused_alerts, deviated_alerts, break_time, deviation_time, focus_time, date')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false }); // Most recent first

      if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
        console.error('Daily stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 });
      }

      // Create a complete 7-day array, filling missing days with zeros
      const dailyMap = new Map();
      if (dailyData) {
        dailyData.forEach(row => {
          dailyMap.set(row.date, row);
        });
      }

      const completeDaily: StatsData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const row = dailyMap.get(dateStr);
        if (row) {
          completeDaily.push({
            tasksCompleted: row.tasks_completed || 0,
            focusSessions: row.focus_sessions || 0,
            breakSessions: row.break_sessions || 0,
            currentStreak: row.current_streak || 0,
            longestStreak: row.longest_streak || 0,
            plannedHours: row.planned_hours || 0,
            completedHours: row.completed_hours || 0,
            totalSessionTime: row.total_session_time || 0,
            focused_alerts: row.focused_alerts || 0,
            deviated_alerts: row.deviated_alerts || 0,
            break_time: row.break_time || 0,
            deviation_time: row.deviation_time || 0,
            focus_time: row.focus_time || 0,
            date: row.date,
          });
        } else {
          completeDaily.push({
            tasksCompleted: 0,
            focusSessions: 0,
            breakSessions: 0,
            currentStreak: 0,
            longestStreak: 0,
            plannedHours: 0,
            completedHours: 0,
            totalSessionTime: 0,
            focused_alerts: 0,
            deviated_alerts: 0,
            break_time: 0,
            deviation_time: 0,
            focus_time: 0,
            date: dateStr,
          });
        }
      }

      data = completeDaily;
    } else if (type === 'weekly' || type === 'monthly' || type === 'yearly') {
      let startDate: Date;
      
      if (type === 'yearly') {
        // For yearly, fetch all data from user's first activity
        // We'll get all records and let the frontend handle the date range
        startDate = new Date('2020-01-01'); // Far back date to get all records
      } else {
        const days = type === 'weekly' ? 7 : 30;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }

      const { data: aggData, error } = await supabase
        .from('daily_achievements')
        .select('tasks_completed, focus_sessions, break_sessions, current_streak, longest_streak, planned_hours, completed_hours, total_session_time, focused_alerts, deviated_alerts, break_time, deviation_time, focus_time')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (error) {
        console.error(`${type} stats error:`, error);
        return NextResponse.json({ error: `Failed to fetch ${type} stats` }, { status: 500 });
      }

      if (aggData && aggData.length > 0) {
        data = {
          tasksCompleted: aggData.reduce((sum, row) => sum + (row.tasks_completed || 0), 0),
          focusSessions: aggData.reduce((sum, row) => sum + (row.focus_sessions || 0), 0),
          breakSessions: aggData.reduce((sum, row) => sum + (row.break_sessions || 0), 0),
          currentStreak: Math.max(...aggData.map(row => row.current_streak || 0)), // Max streak in period
          longestStreak: Math.max(...aggData.map(row => row.longest_streak || 0)), // Max longest streak
          plannedHours: aggData.reduce((sum, row) => sum + (row.planned_hours || 0), 0),
          completedHours: aggData.reduce((sum, row) => sum + (row.completed_hours || 0), 0),
          totalSessionTime: aggData.reduce((sum, row) => sum + (row.total_session_time || 0), 0),
          focused_alerts: aggData.reduce((sum, row) => sum + (row.focused_alerts || 0), 0),
          deviated_alerts: aggData.reduce((sum, row) => sum + (row.deviated_alerts || 0), 0),
          break_time: aggData.reduce((sum, row) => sum + (row.break_time || 0), 0),
          deviation_time: aggData.reduce((sum, row) => sum + (row.deviation_time || 0), 0),
          focus_time: aggData.reduce((sum, row) => sum + (row.focus_time || 0), 0),
        };
      } else {
        data = {
          tasksCompleted: 0,
          focusSessions: 0,
          breakSessions: 0,
          currentStreak: 0,
          longestStreak: 0,
          plannedHours: 0,
          completedHours: 0,
          totalSessionTime: 0,
          focused_alerts: 0,
          deviated_alerts: 0,
          break_time: 0,
          deviation_time: 0,
          focus_time: 0,
        };
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body: StatsData = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Upsert today's record
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_achievements')
      .upsert({
        project_id: projectId,
        user_id: user.id,
        date: today,
        tasks_completed: body.tasksCompleted || 0,
        focus_sessions: body.focusSessions || 0,
        break_sessions: body.breakSessions || 0,
        current_streak: body.currentStreak || 0,
        longest_streak: body.longestStreak || 0,
        planned_hours: body.plannedHours || 0,
        completed_hours: body.completedHours || 0,
        total_session_time: body.totalSessionTime || 0,
        focused_alerts: body.focused_alerts || 0,
        deviated_alerts: body.deviated_alerts || 0,
        break_time: body.break_time || 0,
        deviation_time: body.deviation_time || 0,
        focus_time: body.focus_time || 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json({ error: 'Failed to sync stats' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
