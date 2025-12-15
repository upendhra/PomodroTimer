import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('projectId');
    const reportType = searchParams.get('type'); // 'weekly', 'monthly', 'yearly'
    const startDate = searchParams.get('startDate'); // Optional: YYYY-MM-DD

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    if (!reportType || !['weekly', 'monthly', 'yearly'].includes(reportType)) {
      return NextResponse.json({ error: 'Valid report type required: weekly, monthly, yearly' }, { status: 400 });
    }

    let queryFunction: string = '';
    let params: any[] = [projectId];

    switch (reportType) {
      case 'weekly':
        queryFunction = 'get_weekly_report';
        if (startDate) {
          queryFunction = 'get_weekly_report($1, $2::date)';
          params.push(startDate);
        }
        break;
      case 'monthly':
        queryFunction = 'get_monthly_report';
        if (startDate) {
          queryFunction = 'get_monthly_report($1, $2::date)';
          params.push(startDate);
        }
        break;
      case 'yearly':
        queryFunction = 'get_yearly_report';
        if (startDate) {
          queryFunction = 'get_yearly_report($1, $2::date)';
          params.push(startDate);
        }
        break;
    }

    const { data, error } = await supabase.rpc(queryFunction, params);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }

    return NextResponse.json({ report: data?.[0] || null });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to create/update daily achievements
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { projectId, date, ...updates } = body;

    if (!projectId || !date) {
      return NextResponse.json({ error: 'Project ID and date required' }, { status: 400 });
    }

    // Upsert daily achievement
    const { data, error } = await supabase
      .from('daily_achievements')
      .upsert({
        project_id: projectId,
        date,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,date'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update daily achievement' }, { status: 500 });
    }

    return NextResponse.json({ achievement: data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
