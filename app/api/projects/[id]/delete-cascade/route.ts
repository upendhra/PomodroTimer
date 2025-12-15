import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log('Delete cascade API called');

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No authorization header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  console.log('Attempting to get user...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.log('Auth error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!user) {
    console.log('No user found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('User authenticated:', user.id);

  const { id } = await params;

  try {
    // Verify project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Get all task IDs for this project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', id);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks for deletion' }, { status: 500 });
    }

    const taskIds = tasks?.map(t => t.id) || [];

    // Delete in cascading order to avoid FK violations

    // 1. Delete alert_responses for these tasks (if table exists)
    if (taskIds.length > 0) {
      try {
        const { error: alertRespError } = await supabase
          .from('alert_responses')
          .delete()
          .in('task_id', taskIds);
        if (alertRespError) {
          throw alertRespError;
        }
      } catch (error: any) {
        if (error.code === 'PGRST205' || (error.message && (error.message.includes('does not exist') || error.message.includes('schema cache')))) {
          console.log('alert_responses table does not exist, skipping');
        } else {
          console.error('Error deleting alert_responses:', error);
          return NextResponse.json({ error: 'Failed to delete alert responses' }, { status: 500 });
        }
      }
    }

    // 2. Delete task_alert_settings for these tasks (if table exists)
    if (taskIds.length > 0) {
      try {
        const { error: alertSettingsError } = await supabase
          .from('task_alert_settings')
          .delete()
          .in('task_id', taskIds);
        if (alertSettingsError) {
          throw alertSettingsError;
        }
      } catch (error: any) {
        if (error.code === 'PGRST205' || (error.message && (error.message.includes('does not exist') || error.message.includes('schema cache')))) {
          console.log('task_alert_settings table does not exist, skipping');
        } else {
          console.error('Error deleting task_alert_settings:', error);
          return NextResponse.json({ error: 'Failed to delete task alert settings' }, { status: 500 });
        }
      }
    }

    // 3. Delete task_logs for these tasks (if table exists)
    if (taskIds.length > 0) {
      try {
        const { error: taskLogsError } = await supabase
          .from('task_logs')
          .delete()
          .in('task_id', taskIds);
        if (taskLogsError) {
          throw taskLogsError;
        }
      } catch (error: any) {
        if (error.code === 'PGRST205' || (error.message && (error.message.includes('does not exist') || error.message.includes('schema cache')))) {
          console.log('task_logs table does not exist, skipping');
        } else {
          console.error('Error deleting task_logs:', error);
          return NextResponse.json({ error: 'Failed to delete task logs' }, { status: 500 });
        }
      }
    }

    // 4. Delete tasks
    const { error: tasksDelError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', id);
    if (tasksDelError) {
      console.error('Error deleting tasks:', tasksDelError);
      return NextResponse.json({ error: 'Failed to delete tasks' }, { status: 500 });
    }

    // 5. Finally, delete the project
    const { error: projectDelError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (projectDelError) {
      console.error('Error deleting project:', projectDelError);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    // Log the deletion
    console.log(`Project deleted: ${project.project_name} (ID: ${id}) by user ${user.id} at ${new Date().toISOString()}`);

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Unexpected error during project deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
